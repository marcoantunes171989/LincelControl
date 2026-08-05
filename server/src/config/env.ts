import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootEnv = path.resolve(__dirname, '../../../.env')
const serverEnv = path.resolve(__dirname, '../../.env')

dotenv.config({ path: rootEnv })
dotenv.config({ path: serverEnv })

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) ? value : fallback
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  port: intEnv('PORT', 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  adminApiKey: process.env.ADMIN_API_KEY ?? process.env.ORACLE_ADMIN_API_KEY ?? '',
  dataDir: process.env.DATA_DIR ?? path.resolve(__dirname, '../../data'),
  oracleClientLibDir: process.env.ORACLE_CLIENT_LIB_DIR ?? '',
  oracleTnsAdmin: process.env.ORACLE_TNS_ADMIN ?? '',
  oracleTnsFileName: process.env.ORACLE_TNS_FILE_NAME ?? 'tnsnames.ora',
  oracleTnspingPath: process.env.ORACLE_TNSPING_PATH ?? '',
  oracleTcpTimeoutMs: intEnv('ORACLE_TCP_TIMEOUT_MS', 5000),
  oracleTnspingTimeoutMs: intEnv('ORACLE_TNSPING_TIMEOUT_MS', 10000),
  oracleDbCallTimeoutMs: intEnv('ORACLE_DB_CALL_TIMEOUT_MS', 10000),
  oracleQueueTimeoutMs: intEnv('ORACLE_QUEUE_TIMEOUT_MS', 5000),
  oraclePoolMin: intEnv('ORACLE_POOL_MIN', 0),
  oraclePoolMax: intEnv('ORACLE_POOL_MAX', 5),
  oraclePoolIncrement: intEnv('ORACLE_POOL_INCREMENT', 1),
  oraclePoolTimeout: intEnv('ORACLE_POOL_TIMEOUT', 60),
  oracleAllowRawSql: boolEnv('ORACLE_ALLOW_RAW_SQL', false),
  oracleMaxRows: intEnv('ORACLE_MAX_ROWS', 100),
  oraclePoolAlias: process.env.ORACLE_POOL_ALIAS ?? 'license-control-oracle',
  oracleTnsReadTimeoutMs: intEnv('ORACLE_TNS_READ_TIMEOUT_MS', 5000),
  oraclePoolCloseTimeoutMs: intEnv('ORACLE_POOL_CLOSE_TIMEOUT_MS', 10000),
  rateLimitWindowMs: intEnv('ORACLE_RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: intEnv('ORACLE_RATE_LIMIT_MAX', 20),
  passwordAttemptWindowMs: intEnv('ORACLE_PASSWORD_ATTEMPT_WINDOW_MS', 300_000),
  passwordAttemptMax: intEnv('ORACLE_PASSWORD_ATTEMPT_MAX', 5),
}
