import fs from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'
import type { OracleConfigurationInput, OracleConnectionSettings } from '../oracle/types.js'
import { logger } from '../utils/logger.js'

/**
 * Persistência da configuração Oracle (sem senha).
 * Estrutura equivalente à tabela oracle_connection_settings.
 * Usa JSON em disco para evitar dependências nativas (better-sqlite3/node-gyp).
 */
interface SettingsFile {
  oracle_connection_settings: OracleConnectionSettings | null
}

let cache: SettingsFile = { oracle_connection_settings: null }
let dbPath = ''

function ensureReady(): void {
  if (dbPath) return
  fs.mkdirSync(env.dataDir, { recursive: true })
  dbPath = path.join(env.dataDir, 'oracle_connection_settings.json')
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf8')
      cache = JSON.parse(raw) as SettingsFile
    } catch {
      cache = { oracle_connection_settings: null }
    }
  } else {
    persist()
  }
  logger.info('Store de configuração Oracle inicializado', { dbPath })
}

function persist(): void {
  fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2), 'utf8')
}

export function initializeDatabase(): void {
  ensureReady()
}

export function getOracleSettings(): OracleConnectionSettings | null {
  ensureReady()
  return cache.oracle_connection_settings
}

export function saveOracleSettings(input: OracleConfigurationInput): OracleConnectionSettings {
  ensureReady()
  const now = new Date().toISOString()
  const existing = cache.oracle_connection_settings

  const saved: OracleConnectionSettings = {
    id: 1,
    tnsAdminPath: input.tnsAdminPath.trim(),
    tnsFileName: (input.tnsFileName ?? 'tnsnames.ora').trim() || 'tnsnames.ora',
    tnsAlias: input.tnsAlias.trim(),
    oracleClientLibDir: input.oracleClientLibDir.trim(),
    expectedHost: input.expectedHost.trim(),
    expectedPort: input.expectedPort,
    expectedDatabase: input.expectedDatabase.trim(),
    username: input.username.trim(),
    isEnabled: input.isEnabled === undefined ? Boolean(existing?.isEnabled) : Boolean(input.isEnabled),
    lastValidationStatus: existing?.lastValidationStatus ?? null,
    lastValidationMessage: existing?.lastValidationMessage ?? null,
    lastValidatedAt: existing?.lastValidatedAt ?? null,
    lastConnectedAt: existing?.lastConnectedAt ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  cache.oracle_connection_settings = saved
  persist()
  return saved
}

export function updateOracleValidationMeta(meta: {
  isEnabled?: boolean
  lastValidationStatus?: string | null
  lastValidationMessage?: string | null
  lastValidatedAt?: string | null
  lastConnectedAt?: string | null
}): OracleConnectionSettings | null {
  ensureReady()
  const existing = cache.oracle_connection_settings
  if (!existing) return null

  cache.oracle_connection_settings = {
    ...existing,
    isEnabled: meta.isEnabled === undefined ? existing.isEnabled : meta.isEnabled,
    lastValidationStatus:
      meta.lastValidationStatus === undefined ? existing.lastValidationStatus : meta.lastValidationStatus,
    lastValidationMessage:
      meta.lastValidationMessage === undefined ? existing.lastValidationMessage : meta.lastValidationMessage,
    lastValidatedAt: meta.lastValidatedAt === undefined ? existing.lastValidatedAt : meta.lastValidatedAt,
    lastConnectedAt: meta.lastConnectedAt === undefined ? existing.lastConnectedAt : meta.lastConnectedAt,
    updatedAt: new Date().toISOString(),
  }
  persist()
  return cache.oracle_connection_settings
}

export function closeDatabase(): void {
  cache = { oracle_connection_settings: null }
  dbPath = ''
}
