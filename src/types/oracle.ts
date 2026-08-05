export type OracleConnectionStatus =
  | 'not_configured'
  | 'password_required'
  | 'validating'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'error'
  | 'oracle_client_unavailable'
  | 'tns_unavailable'
  | 'database_unreachable'

export type DiagnosticTone = 'success' | 'warning' | 'error' | 'skipped' | 'running' | 'idle'

export interface StageResult {
  stage: string
  ok: boolean
  status: DiagnosticTone
  message: string
  expected?: string | number | null
  found?: string | number | string[] | number[] | null
  durationMs?: number
  details?: Record<string, unknown>
}

export interface TnsAliasInfo {
  alias: string
  hosts: string[]
  ports: number[]
  protocols: string[]
  serviceName: string | null
  sid: string | null
  hasFailover: boolean
  hasMultipleHosts: boolean
}

export interface OracleConfigurationPayload {
  id?: number
  tnsAdminPath: string
  tnsFileName: string
  tnsAlias: string
  oracleClientLibDir: string
  expectedHost: string
  expectedPort: number | null
  expectedDatabase: string
  username: string
  isEnabled?: boolean
  lastValidationStatus?: string | null
  lastValidationMessage?: string | null
  lastValidatedAt?: string | null
  lastConnectedAt?: string | null
}

export interface OracleRuntimeStatus {
  configured: boolean
  enabled: boolean
  connected: boolean
  status: OracleConnectionStatus
  passwordAvailableInMemory: boolean
  clientInitialized: boolean
  clientVersion: string | null
  clientArchitecture: string | null
  ociDllFound: boolean | null
  pool: { connectionsOpen: number; connectionsInUse: number } | null
  database: {
    alias: string | null
    host: string | null
    port: number | null
    serviceName: string | null
    sid: string | null
    instanceName: string | null
    serverHost: string | null
    databaseName: string | null
    sessionUser: string | null
    oracleVersion: string | null
  }
  paths: {
    tnsAdminPath: string | null
    tnsFileName: string | null
    oracleClientLibDir: string | null
  }
  lastValidatedAt: string | null
  lastConnectedAt: string | null
  lastValidationDurationMs: number | null
  lastError: string | null
  stages: StageResult[]
}

export interface OracleValidateResponse {
  ok: boolean
  stages: StageResult[]
  alias: TnsAliasInfo | null
  status: OracleRuntimeStatus
  message?: string
}

export interface OracleFormState {
  tnsAdminPath: string
  tnsFileName: string
  tnsAlias: string
  oracleClientLibDir: string
  expectedHost: string
  expectedPort: string
  expectedDatabase: string
  username: string
  password: string
}

export const EMPTY_ORACLE_FORM: OracleFormState = {
  tnsAdminPath: '',
  tnsFileName: 'tnsnames.ora',
  tnsAlias: '',
  oracleClientLibDir: '',
  expectedHost: '',
  expectedPort: '1521',
  expectedDatabase: '',
  username: '',
  password: '',
}

export const DIAGNOSTIC_STEPS = [
  { stage: 'oracle-client', label: 'Oracle Client' },
  { stage: 'tns-file', label: 'Arquivo TNS' },
  { stage: 'tns-alias', label: 'Alias' },
  { stage: 'tns-comparison', label: 'HOST/IP' },
  { stage: 'dns', label: 'DNS' },
  { stage: 'tcp', label: 'Porta TCP' },
  { stage: 'tnsping', label: 'TNSPING' },
  { stage: 'authentication', label: 'Usuário e senha' },
  { stage: 'dual-query', label: 'Consulta em DUAL' },
  { stage: 'pool', label: 'Pool de conexões' },
] as const
