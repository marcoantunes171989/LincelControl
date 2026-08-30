import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LICENSE_INTEGER_FIELDS,
  MODULE_FIELDS,
  NUM_CGC_COLUMN,
  resolveModuleValue,
} from '../src/oracle/licenseFields.js'
import { applyLicenseUpdate, previewLicenseUpdate } from '../src/oracle/licenseUpdate.js'
import { oracleService } from '../src/oracle/service.js'
import type { OracleRuntimeStatus } from '../src/oracle/types.js'

function buildModulesRecord(activeIds: string[] = []): Record<string, boolean> {
  const record: Record<string, boolean> = {}
  for (const field of MODULE_FIELDS) {
    record[field.id] = activeIds.includes(field.id)
  }
  return record
}

function buildPayload(overrides: Record<string, unknown> = {}) {
  return {
    store: { codLoja: '1', numCgc: '02274225000161', descricao: 'Loja Teste' },
    license: {
      numLicenca: '9090',
      numDiaVencto: '5',
      numPdv: '100',
      numPdvBalcao: '1',
      numPdvReserva: '0',
      numPdvRecebto: '1',
    },
    modules: buildModulesRecord(['MOD_MOVIMENTO', 'MOD_VENDAS']),
    nfeExpertMode: 'embedded',
    ...overrides,
  }
}

function buildCurrentRowFromPayload(
  payload: ReturnType<typeof buildPayload>,
  cnpjOverride?: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { COD_LOJA: Number(payload.store.codLoja) }
  for (const field of MODULE_FIELDS) {
    row[field.column] = resolveModuleValue(
      field,
      payload.modules as Record<string, boolean>,
      payload.nfeExpertMode as 'nenhuma' | 'embedded' | 'partner',
    )
  }
  for (const field of LICENSE_INTEGER_FIELDS) {
    row[field.column] = Number((payload.license as Record<string, string>)[field.key])
  }
  row[NUM_CGC_COLUMN] = cnpjOverride ?? payload.store.numCgc.replace(/\D/g, '')
  return row
}

function baseStatus(): OracleRuntimeStatus {
  return {
    configured: true,
    enabled: true,
    connected: true,
    status: 'connected',
    passwordAvailableInMemory: true,
    clientInitialized: true,
    clientVersion: 'oracledb-thin',
    clientArchitecture: 'x64',
    ociDllFound: false,
    pool: { connectionsOpen: 1, connectionsInUse: 1 },
    database: {
      alias: 'ORCL',
      host: '192.168.0.238',
      port: 1521,
      serviceName: 'orcl.intersoul',
      sid: null,
      instanceName: null,
      serverHost: null,
      databaseName: null,
      sessionUser: 'INTERSOLID',
      oracleVersion: null,
    },
    paths: { tnsAdminPath: null, tnsFileName: null, oracleClientLibDir: null },
    lastValidatedAt: null,
    lastConnectedAt: null,
    lastValidationDurationMs: null,
    lastError: null,
    stages: [],
  }
}

function fakeConnection(
  executeImpl: (sql: string, binds: unknown, options: unknown) => Promise<unknown> | unknown,
) {
  return {
    execute: vi.fn(executeImpl),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }
}

describe('licenseUpdate (preview/apply, sem Oracle real — tudo mockado)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preview: rejeita quando Oracle está desconectado', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(false)
    await expect(previewLicenseUpdate(buildPayload())).rejects.toMatchObject({ code: 'ORACLE_DISCONNECTED' })
  })

  it('apply: rejeita quando Oracle está desconectado', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(false)
    await expect(applyLicenseUpdate({ ...buildPayload(), previewToken: 'x'.repeat(20) })).rejects.toMatchObject({
      code: 'ORACLE_DISCONNECTED',
    })
  })

  it('rejeita módulo desconhecido no payload (whitelist)', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    const payload = buildPayload({ modules: { ...buildModulesRecord(), NAO_EXISTE: true } })
    await expect(previewLicenseUpdate(payload)).rejects.toThrow()
  })

  it('preview: loja não encontrada', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValue(fakeConnection(async () => ({ rows: [] })) as never)
    await expect(previewLicenseUpdate(buildPayload())).rejects.toMatchObject({ code: 'STORE_NOT_FOUND' })
  })

  it('preview: CNPJ divergente bloqueia a alteração', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const row = buildCurrentRowFromPayload(payload, '11111111000191')
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValue(fakeConnection(async () => ({ rows: [row] })) as never)
    await expect(previewLicenseUpdate(payload)).rejects.toMatchObject({ code: 'CNPJ_MISMATCH' })
  })

  it('preview: nenhuma alteração necessária quando os valores já conferem', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const row = buildCurrentRowFromPayload(payload)
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValue(fakeConnection(async () => ({ rows: [row] })) as never)

    const result = await previewLicenseUpdate(payload)
    expect(result.ok).toBe(true)
    expect(result.changedCount).toBe(0)
    expect(result.changedFields).toEqual([])
    expect(result.message).toMatch(/nenhuma alteração/i)
  })

  it('preview: retorna somente os campos que sofrerão alteração', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const row = buildCurrentRowFromPayload(payload)
    row.NUM_LICENCA = 1
    row.MOD_VENDAS = 'N'
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValue(fakeConnection(async () => ({ rows: [row] })) as never)

    const result = await previewLicenseUpdate(payload)
    expect(result.changedCount).toBe(2)
    const fields = result.changedFields.map((item) => item.field).sort()
    expect(fields).toEqual(['MOD_VENDAS', 'NUM_LICENCA'])
    const licenseChange = result.changedFields.find((item) => item.field === 'NUM_LICENCA')
    expect(licenseChange).toMatchObject({ oldValue: 1, newValue: 9090 })
  })

  it('preview: nunca retorna senha no payload de resposta', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const row = buildCurrentRowFromPayload(payload)
    row.NUM_LICENCA = 1
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValue(fakeConnection(async () => ({ rows: [row] })) as never)

    const result = await previewLicenseUpdate(payload)
    expect(JSON.stringify(result)).not.toMatch(/password|senha/i)
  })

  it('apply: commit quando rowsAffected=1 e verificação pós-UPDATE confere', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)
    expect(preview.changedCount).toBe(1)

    const connection = fakeConnection(async (sql: string) => {
      if (sql.includes('FOR UPDATE')) return { rows: [currentRow] }
      if (sql.startsWith('UPDATE')) return { rowsAffected: 1 }
      return { rows: [{ NUM_LICENCA: Number(payload.license.numLicenca) }] }
    })
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(connection as never)

    const result = await applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })
    expect(result.ok).toBe(true)
    expect(result.verified).toBe(true)
    expect(result.rowsAffected).toBe(1)
    expect(result.changedCount).toBe(1)
    expect(connection.commit).toHaveBeenCalledTimes(1)
    expect(connection.rollback).not.toHaveBeenCalled()
    expect(connection.close).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(result)).not.toMatch(/password|senha/i)
  })

  it('apply: rowsAffected=0 -> ROLLBACK e erro, sem COMMIT', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    const connection = fakeConnection(async (sql: string) => {
      if (sql.includes('FOR UPDATE')) return { rows: [currentRow] }
      if (sql.startsWith('UPDATE')) return { rowsAffected: 0 }
      return { rows: [] }
    })
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(connection as never)

    await expect(applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })).rejects.toMatchObject({
      code: 'UNEXPECTED_ROWS_AFFECTED',
    })
    expect(connection.rollback).toHaveBeenCalledTimes(1)
    expect(connection.commit).not.toHaveBeenCalled()
  })

  it('apply: verificação pós-UPDATE divergente -> ROLLBACK', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    const connection = fakeConnection(async (sql: string) => {
      if (sql.includes('FOR UPDATE')) return { rows: [currentRow] }
      if (sql.startsWith('UPDATE')) return { rowsAffected: 1 }
      // Simula gravação que não pegou (valor errado na conferência)
      return { rows: [{ NUM_LICENCA: 4242 }] }
    })
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(connection as never)

    await expect(applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })).rejects.toMatchObject({
      code: 'VERIFICATION_FAILED',
    })
    expect(connection.rollback).toHaveBeenCalledTimes(1)
    expect(connection.commit).not.toHaveBeenCalled()
  })

  it('apply: loja não encontrada dentro da transação -> ROLLBACK', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    const connection = fakeConnection(async () => ({ rows: [] }))
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(connection as never)

    await expect(applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })).rejects.toMatchObject({
      code: 'STORE_NOT_FOUND',
    })
    expect(connection.rollback).toHaveBeenCalledTimes(1)
  })

  it('apply: nenhuma alteração necessária -> não executa UPDATE nem COMMIT', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    // Entre o preview e o apply, alguém já corrigiu o valor no Oracle diretamente.
    const matchingRow = buildCurrentRowFromPayload(payload)
    const connection = fakeConnection(async (sql: string) => {
      if (sql.includes('FOR UPDATE')) return { rows: [matchingRow] }
      throw new Error(`UPDATE não deveria ter sido chamado: ${sql}`)
    })
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(connection as never)

    const result = await applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })
    expect(result.changedCount).toBe(0)
    expect(result.rowsAffected).toBe(0)
    expect(connection.commit).not.toHaveBeenCalled()
  })

  it('apply: previewToken expirado/adulterado é rejeitado antes de tocar o Oracle', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    const getConnectionSpy = vi.spyOn(oracleService, 'getOracleConnection')
    await expect(
      applyLicenseUpdate({ ...buildPayload(), previewToken: 'token-invalido-adulterado' }),
    ).rejects.toMatchObject({ code: 'PREVIEW_TOKEN_INVALID' })
    expect(getConnectionSpy).not.toHaveBeenCalled()
  })

  it('apply: dados alterados desde o preview (hash diferente) são rejeitados', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1
    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    const tamperedPayload = buildPayload({
      license: { ...payload.license, numLicenca: '5555' },
    })
    const getConnectionSpy = vi.spyOn(oracleService, 'getOracleConnection')
    getConnectionSpy.mockClear()
    await expect(
      applyLicenseUpdate({ ...tamperedPayload, previewToken: preview.previewToken }),
    ).rejects.toMatchObject({ code: 'PREVIEW_TOKEN_STALE' })
    expect(getConnectionSpy).not.toHaveBeenCalled()
  })

  it('bloqueia duas atualizações simultâneas da mesma loja (proteção contra clique duplo)', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload()
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    let resolveConnection!: (value: unknown) => void
    const pendingConnection = new Promise((resolve) => {
      resolveConnection = resolve
    })
    vi.spyOn(oracleService, 'getOracleConnection').mockReturnValueOnce(pendingConnection as never)

    const first = applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })
    const second = applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })

    await expect(second).rejects.toMatchObject({ code: 'LICENSE_UPDATE_IN_PROGRESS' })

    resolveConnection(
      fakeConnection(async (sql: string) => {
        if (sql.includes('FOR UPDATE')) return { rows: [currentRow] }
        if (sql.startsWith('UPDATE')) return { rowsAffected: 1 }
        return { rows: [{ NUM_LICENCA: Number(payload.license.numLicenca) }] }
      }),
    )
    const firstResult = await first
    expect(firstResult.ok).toBe(true)
  })

  it('libera o lock mesmo após falha, permitindo nova tentativa em seguida', async () => {
    vi.spyOn(oracleService, 'isConnected').mockReturnValue(true)
    vi.spyOn(oracleService, 'getStatus').mockReturnValue(baseStatus())
    const payload = buildPayload({ store: { codLoja: '77', numCgc: '02274225000161', descricao: 'Loja 77' } })
    const currentRow = buildCurrentRowFromPayload(payload)
    currentRow.NUM_LICENCA = 1

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async () => ({ rows: [currentRow] })) as never,
    )
    const preview = await previewLicenseUpdate(payload)

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async (sql: string) => {
        if (sql.includes('FOR UPDATE')) return { rows: [currentRow] }
        if (sql.startsWith('UPDATE')) return { rowsAffected: 0 }
        return { rows: [] }
      }) as never,
    )
    await expect(applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })).rejects.toMatchObject({
      code: 'UNEXPECTED_ROWS_AFFECTED',
    })

    vi.spyOn(oracleService, 'getOracleConnection').mockResolvedValueOnce(
      fakeConnection(async (sql: string) => {
        if (sql.includes('FOR UPDATE')) return { rows: [currentRow] }
        if (sql.startsWith('UPDATE')) return { rowsAffected: 1 }
        return { rows: [{ NUM_LICENCA: Number(payload.license.numLicenca) }] }
      }) as never,
    )
    const retryResult = await applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })
    expect(retryResult.ok).toBe(true)
  })
})
