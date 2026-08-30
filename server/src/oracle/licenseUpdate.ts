import crypto from 'node:crypto'
import type { Connection } from 'oracledb'
import { z } from 'zod'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { getOracledb } from './client.js'
import { translateOracleError } from './errors.js'
import {
  COD_LOJA_COLUMN,
  LICENSE_INTEGER_FIELDS,
  MODULE_FIELDS,
  NUM_CGC_COLUMN,
  isKnownModuleId,
  resolveModuleValue,
  type LicenseIntegerFieldDefinition,
  type NfeExpertMode,
} from './licenseFields.js'
import { oracleService } from './service.js'

/**
 * Operação dedicada de aplicação de licença na TAB_LOJA.
 *
 * Propositalmente SEM SQL livre: o UPDATE é montado só com colunas do
 * catálogo (licenseFields.ts) e todos os valores viram binds Oracle.
 * Nenhum texto vindo do frontend (nome de coluna, cláusula, etc.) chega
 * até o SQL — apenas os `id`s de módulo conhecidos e os campos fixos de
 * licença/CNPJ/COD_LOJA.
 */

const INTEGER_REGEX = /^[0-9]+$/

function serviceError(message: string, statusCode: number, code: string): Error {
  return Object.assign(new Error(message), { statusCode, code })
}

const storeSchema = z.object({
  codLoja: z.string().min(1, 'COD_LOJA é obrigatório.'),
  numCgc: z.string().min(1, 'CNPJ é obrigatório.'),
  descricao: z.string().optional(),
})

const licenseSchema = z.object({
  numLicenca: z.string(),
  numDiaVencto: z.string(),
  numPdv: z.string(),
  numPdvBalcao: z.string(),
  numPdvReserva: z.string(),
  numPdvRecebto: z.string(),
})

const modulesSchema = z.record(z.string(), z.boolean()).superRefine((value, ctx) => {
  for (const key of Object.keys(value)) {
    if (!isKnownModuleId(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Módulo não autorizado: ${key}`,
        path: [key],
      })
    }
  }
})

export const licenseUpdatePayloadSchema = z.object({
  store: storeSchema,
  license: licenseSchema,
  modules: modulesSchema,
  nfeExpertMode: z.enum(['nenhuma', 'embedded', 'partner']),
})

export const licenseUpdateApplyPayloadSchema = licenseUpdatePayloadSchema.extend({
  previewToken: z.string().min(10, 'previewToken ausente. Gere uma nova prévia antes de aplicar.'),
})

export type LicenseUpdatePayload = z.infer<typeof licenseUpdatePayloadSchema>
export type LicenseUpdateApplyPayload = z.infer<typeof licenseUpdateApplyPayloadSchema>

interface DesiredColumn {
  column: string
  value: string | number
  kind: 'module' | 'license_integer' | 'cnpj'
}

export interface ChangedField {
  field: string
  oldValue: string | number | null
  newValue: string | number
}

export interface DatabaseInfo {
  alias: string | null
  host: string | null
  port: number | null
  serviceName: string | null
  username: string | null
}

export interface LicenseUpdatePreviewResult {
  ok: true
  previewToken: string
  store: { codLoja: number; cnpj: string; descricao: string | null }
  database: DatabaseInfo
  changedFields: ChangedField[]
  changedCount: number
  message: string
}

export interface LicenseUpdateApplyResult {
  ok: true
  verified: true
  store: { codLoja: number; cnpj: string; descricao: string | null }
  database: DatabaseInfo
  changedFields: ChangedField[]
  changedCount: number
  rowsAffected: number
  durationMs: number
  appliedAt: string
}

function parsePositiveCodLoja(raw: string): number {
  const value = raw.trim()
  if (!INTEGER_REGEX.test(value)) {
    throw serviceError('COD_LOJA inválido. Informe um número inteiro maior que zero.', 400, 'INVALID_COD_LOJA')
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw serviceError('COD_LOJA inválido. Informe um número inteiro maior que zero.', 400, 'INVALID_COD_LOJA')
  }
  return parsed
}

function parseLicenseInteger(raw: string, field: LicenseIntegerFieldDefinition): number {
  const value = raw.trim()
  if (!INTEGER_REGEX.test(value)) {
    throw serviceError(`${field.column} inválido. Informe um número inteiro sem sinais ou letras.`, 400, 'INVALID_LICENSE_FIELD')
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) {
    throw serviceError(`${field.column} inválido.`, 400, 'INVALID_LICENSE_FIELD')
  }
  if (parsed < field.min || (field.max !== undefined && parsed > field.max)) {
    throw serviceError(`${field.column} fora do intervalo permitido.`, 400, 'INVALID_LICENSE_FIELD')
  }
  return parsed
}

function normalizeCnpjDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 14) {
    throw serviceError('CNPJ inválido. Informe 14 dígitos.', 400, 'INVALID_CNPJ')
  }
  return digits
}

function maskCnpj(digits: string): string {
  if (digits.length !== 14) return '****'
  return `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}`
}

function buildDesiredColumns(payload: LicenseUpdatePayload): DesiredColumn[] {
  const columns: DesiredColumn[] = MODULE_FIELDS.map((field) => ({
    column: field.column,
    value: resolveModuleValue(field, payload.modules, payload.nfeExpertMode as NfeExpertMode),
    kind: 'module' as const,
  }))

  for (const field of LICENSE_INTEGER_FIELDS) {
    columns.push({
      column: field.column,
      value: parseLicenseInteger(payload.license[field.key], field),
      kind: 'license_integer',
    })
  }

  columns.push({
    column: NUM_CGC_COLUMN,
    value: normalizeCnpjDigits(payload.store.numCgc),
    kind: 'cnpj',
  })

  return columns
}

function valuesEqual(kind: DesiredColumn['kind'], current: unknown, desired: string | number): boolean {
  if (current === null || current === undefined) return false
  if (kind === 'module' || kind === 'cnpj') {
    return String(current).trim().toUpperCase() === String(desired).trim().toUpperCase()
  }
  const currentNumber = typeof current === 'number' ? current : Number(current)
  return Number.isFinite(currentNumber) && currentNumber === desired
}

function diffChangedFields(desired: DesiredColumn[], row: Record<string, unknown>): ChangedField[] {
  const changed: ChangedField[] = []
  for (const column of desired) {
    const current = row[column.column]
    if (!valuesEqual(column.kind, current, column.value)) {
      changed.push({
        field: column.column,
        oldValue: (current as string | number | null | undefined) ?? null,
        newValue: column.value,
      })
    }
  }
  return changed
}

function hashDesiredColumns(columns: DesiredColumn[]): string {
  const normalized = columns
    .map((column) => `${column.column}=${column.value}`)
    .sort()
    .join('|')
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

let cachedPreviewTokenSecret: string | null = null
function getPreviewTokenSecret(): string {
  if (env.oraclePreviewTokenSecret) return env.oraclePreviewTokenSecret
  if (!cachedPreviewTokenSecret) {
    cachedPreviewTokenSecret = crypto.randomBytes(32).toString('hex')
  }
  return cachedPreviewTokenSecret
}

function signPreviewToken(payload: { codLoja: number; valuesHash: string }): string {
  const body = JSON.stringify({ ...payload, iat: Date.now() })
  const encoded = Buffer.from(body, 'utf8').toString('base64url')
  const signature = crypto.createHmac('sha256', getPreviewTokenSecret()).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

interface PreviewTokenPayload {
  codLoja: number
  valuesHash: string
  iat: number
}

function verifyPreviewToken(token: string): PreviewTokenPayload {
  const [encoded, signature] = String(token).split('.')
  if (!encoded || !signature) {
    throw serviceError('previewToken inválido. Gere uma nova prévia.', 400, 'PREVIEW_TOKEN_INVALID')
  }

  const expected = crypto.createHmac('sha256', getPreviewTokenSecret()).update(encoded).digest('base64url')
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  const valid =
    signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  if (!valid) {
    throw serviceError('previewToken inválido. Gere uma nova prévia.', 400, 'PREVIEW_TOKEN_INVALID')
  }

  let decoded: PreviewTokenPayload
  try {
    decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as PreviewTokenPayload
  } catch {
    throw serviceError('previewToken inválido. Gere uma nova prévia.', 400, 'PREVIEW_TOKEN_INVALID')
  }

  if (Date.now() - decoded.iat > env.oraclePreviewTokenTtlMs) {
    throw serviceError('Prévia expirada. Gere uma nova antes de aplicar.', 400, 'PREVIEW_TOKEN_EXPIRED')
  }

  return decoded
}

function currentDatabaseInfo(): DatabaseInfo {
  const status = oracleService.getStatus()
  return {
    alias: status.database.alias,
    host: status.database.host,
    port: status.database.port,
    serviceName: status.database.serviceName,
    username: status.database.sessionUser,
  }
}

function translateServiceError(error: unknown, stage: string): Error {
  const err = error as { statusCode?: number }
  if (err && typeof err.statusCode === 'number') return error as Error
  const translated = translateOracleError(error, stage)
  return Object.assign(new Error(translated.message), {
    statusCode: 400,
    code: translated.code,
    technicalMessage: translated.technicalMessage,
  })
}

async function safeClose(connection: Connection | null): Promise<void> {
  if (!connection) return
  try {
    await connection.close()
  } catch {
    /* ignore */
  }
}

async function safeRollback(connection: Connection): Promise<void> {
  try {
    await connection.rollback()
  } catch (error) {
    logger.warn('oracle-license-update: falha ao executar ROLLBACK', {
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

function ensureOracleConnected(action: string): void {
  if (!oracleService.isConnected()) {
    throw serviceError(`Oracle desconectado. Conecte antes de ${action} a atualização de licença.`, 503, 'ORACLE_DISCONNECTED')
  }
}

/**
 * Consulta a TAB_LOJA e retorna somente os campos que sofrerão alteração,
 * sem travar linhas nem executar nenhum UPDATE.
 */
export async function previewLicenseUpdate(rawPayload: unknown, actor?: string): Promise<LicenseUpdatePreviewResult> {
  const payload = licenseUpdatePayloadSchema.parse(rawPayload)
  ensureOracleConnected('pré-validar')

  const codLoja = parsePositiveCodLoja(payload.store.codLoja)
  const desired = buildDesiredColumns(payload)
  const oracledb = getOracledb()
  const selectSql = `SELECT ${COD_LOJA_COLUMN}, ${desired.map((column) => column.column).join(', ')} FROM TAB_LOJA WHERE ${COD_LOJA_COLUMN} = :codLoja`

  let connection: Connection | null = null
  try {
    connection = await oracleService.getOracleConnection()
    const result = await connection.execute<Record<string, unknown>>(
      selectSql,
      { codLoja },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    )
    const rows = result.rows ?? []
    if (rows.length === 0) {
      throw serviceError(`Loja ${codLoja} não encontrada no Oracle.`, 404, 'STORE_NOT_FOUND')
    }
    if (rows.length > 1) {
      throw serviceError(`Mais de uma loja encontrada para COD_LOJA ${codLoja}.`, 409, 'STORE_AMBIGUOUS')
    }

    const row = rows[0]
    const currentCnpj = String(row[NUM_CGC_COLUMN] ?? '').replace(/\D/g, '')
    const desiredCnpj = normalizeCnpjDigits(payload.store.numCgc)
    if (currentCnpj !== desiredCnpj) {
      throw serviceError(
        'CNPJ informado não corresponde ao CNPJ cadastrado para esta loja no Oracle.',
        409,
        'CNPJ_MISMATCH',
      )
    }

    const changedFields = diffChangedFields(desired, row)
    const previewToken = signPreviewToken({ codLoja, valuesHash: hashDesiredColumns(desired) })

    logger.info('oracle-license-update: preview gerado', {
      event: 'oracle-license-update',
      phase: 'preview',
      actor: actor ?? 'system',
      codLoja,
      cnpjMasked: maskCnpj(desiredCnpj),
      changedCount: changedFields.length,
    })

    return {
      ok: true,
      previewToken,
      store: { codLoja, cnpj: desiredCnpj, descricao: payload.store.descricao ?? null },
      database: currentDatabaseInfo(),
      changedFields,
      changedCount: changedFields.length,
      message:
        changedFields.length === 0
          ? 'A base Oracle já possui os valores informados. Nenhuma alteração necessária.'
          : `${changedFields.length} campo(s) serão alterados.`,
    }
  } catch (error) {
    throw translateServiceError(error, 'license-update-preview')
  } finally {
    await safeClose(connection)
  }
}

const inFlightCodLoja = new Set<number>()

function acquireLock(codLoja: number): void {
  if (inFlightCodLoja.has(codLoja)) {
    throw serviceError(
      'Já existe uma atualização em andamento para esta loja. Aguarde a conclusão antes de tentar novamente.',
      409,
      'LICENSE_UPDATE_IN_PROGRESS',
    )
  }
  inFlightCodLoja.add(codLoja)
}

function releaseLock(codLoja: number): void {
  inFlightCodLoja.delete(codLoja)
}

async function runApplyTransaction(options: {
  codLoja: number
  desired: DesiredColumn[]
  payload: LicenseUpdateApplyPayload
  actor?: string
  started: number
}): Promise<LicenseUpdateApplyResult> {
  const { codLoja, desired, payload, actor, started } = options
  const oracledb = getOracledb()
  const selectForUpdateSql = `SELECT ${COD_LOJA_COLUMN}, ${desired.map((column) => column.column).join(', ')} FROM TAB_LOJA WHERE ${COD_LOJA_COLUMN} = :codLoja FOR UPDATE NOWAIT`

  let connection: Connection | null = null
  let committed = false

  try {
    // Uma única conexão para toda a transação — nunca autoCommit: true nesta operação.
    connection = await oracleService.getOracleConnection()

    const current = await connection.execute<Record<string, unknown>>(
      selectForUpdateSql,
      { codLoja },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    )
    const rows = current.rows ?? []
    if (rows.length === 0) {
      throw serviceError(`Loja ${codLoja} não encontrada no Oracle.`, 404, 'STORE_NOT_FOUND')
    }
    if (rows.length > 1) {
      throw serviceError(`Mais de uma loja encontrada para COD_LOJA ${codLoja}.`, 409, 'STORE_AMBIGUOUS')
    }

    const row = rows[0]
    const currentCnpj = String(row[NUM_CGC_COLUMN] ?? '').replace(/\D/g, '')
    const desiredCnpj = normalizeCnpjDigits(payload.store.numCgc)
    if (currentCnpj !== desiredCnpj) {
      throw serviceError(
        'CNPJ informado não corresponde ao CNPJ cadastrado para esta loja no Oracle.',
        409,
        'CNPJ_MISMATCH',
      )
    }

    const changedFields = diffChangedFields(desired, row)
    if (changedFields.length === 0) {
      // Nada para alterar: reverte a transação de leitura (FOR UPDATE) sem tocar em dado nenhum.
      await safeRollback(connection)
      return {
        ok: true,
        verified: true,
        store: { codLoja, cnpj: desiredCnpj, descricao: payload.store.descricao ?? null },
        database: currentDatabaseInfo(),
        changedFields: [],
        changedCount: 0,
        rowsAffected: 0,
        durationMs: Date.now() - started,
        appliedAt: new Date().toISOString(),
      }
    }

    const updateBinds: Record<string, string | number> = { codLoja }
    const setClause = changedFields
      .map((field, index) => {
        const bindName = `s${index}`
        updateBinds[bindName] = field.newValue
        return `${field.field} = :${bindName}`
      })
      .join(', ')
    const updateSql = `UPDATE TAB_LOJA SET ${setClause} WHERE ${COD_LOJA_COLUMN} = :codLoja`

    const updateResult = await connection.execute(updateSql, updateBinds, { autoCommit: false })
    const rowsAffected = updateResult.rowsAffected ?? 0
    if (rowsAffected !== 1) {
      throw serviceError(
        `Atualização inesperada: ${rowsAffected} linha(s) afetada(s) (esperado 1). Operação revertida.`,
        409,
        'UNEXPECTED_ROWS_AFFECTED',
      )
    }

    const verifySql = `SELECT ${changedFields.map((field) => field.field).join(', ')} FROM TAB_LOJA WHERE ${COD_LOJA_COLUMN} = :codLoja`
    const verifyResult = await connection.execute<Record<string, unknown>>(
      verifySql,
      { codLoja },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    )
    const verifyRow = (verifyResult.rows ?? [])[0] as Record<string, unknown> | undefined
    const desiredByColumn = new Map(desired.map((column) => [column.column, column]))
    const stillMismatched = changedFields.some((field) => {
      const definition = desiredByColumn.get(field.field)
      if (!definition || !verifyRow) return true
      return !valuesEqual(definition.kind, verifyRow[field.field], definition.value)
    })
    if (stillMismatched) {
      throw serviceError(
        'Verificação pós-atualização falhou: valores gravados não conferem com o esperado. Operação revertida.',
        500,
        'VERIFICATION_FAILED',
      )
    }

    await connection.commit()
    committed = true

    const durationMs = Date.now() - started
    const database = currentDatabaseInfo()
    logger.info('oracle-license-update: aplicado com sucesso', {
      event: 'oracle-license-update',
      phase: 'apply',
      status: 'committed',
      actor: actor ?? 'system',
      codLoja,
      cnpjMasked: maskCnpj(desiredCnpj),
      alias: database.alias,
      host: database.host,
      serviceName: database.serviceName,
      username: database.username,
      changedFields: changedFields.map((field) => field.field),
      rowsAffected,
      durationMs,
    })

    return {
      ok: true,
      verified: true,
      store: { codLoja, cnpj: desiredCnpj, descricao: payload.store.descricao ?? null },
      database,
      changedFields,
      changedCount: changedFields.length,
      rowsAffected,
      durationMs,
      appliedAt: new Date().toISOString(),
    }
  } catch (error) {
    if (connection && !committed) {
      await safeRollback(connection)
    }
    logger.error('oracle-license-update: falha na aplicação, rollback executado', {
      event: 'oracle-license-update',
      phase: 'apply',
      status: 'rolled_back',
      actor: actor ?? 'system',
      codLoja,
      message: error instanceof Error ? error.message : String(error),
    })
    throw translateServiceError(error, 'license-update-apply')
  } finally {
    await safeClose(connection)
  }
}

/**
 * Aplica a atualização de licença dentro de uma única transação Oracle:
 * SELECT ... FOR UPDATE NOWAIT → valida COD_LOJA/CNPJ → UPDATE parametrizado →
 * confere rowsAffected === 1 → SELECT de conferência → COMMIT.
 * Qualquer falha em qualquer etapa gera ROLLBACK automático.
 */
export async function applyLicenseUpdate(rawPayload: unknown, actor?: string): Promise<LicenseUpdateApplyResult> {
  const started = Date.now()
  const payload = licenseUpdateApplyPayloadSchema.parse(rawPayload)
  ensureOracleConnected('aplicar')

  const codLoja = parsePositiveCodLoja(payload.store.codLoja)
  const desired = buildDesiredColumns(payload)
  const tokenPayload = verifyPreviewToken(payload.previewToken)
  if (tokenPayload.codLoja !== codLoja || tokenPayload.valuesHash !== hashDesiredColumns(desired)) {
    throw serviceError(
      'Os dados mudaram desde a pré-visualização. Gere uma nova prévia antes de aplicar.',
      409,
      'PREVIEW_TOKEN_STALE',
    )
  }

  acquireLock(codLoja)
  try {
    return await runApplyTransaction({ codLoja, desired, payload, actor, started })
  } finally {
    releaseLock(codLoja)
  }
}
