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

export type ValidationStage =
  | 'oracle-client'
  | 'tns-file'
  | 'tns-alias'
  | 'tns-comparison'
  | 'dns'
  | 'tcp'
  | 'tnsping'
  | 'authentication'
  | 'dual-query'
  | 'pool'
  | 'configuration'

export interface TnsAddress {
  protocol: string | null
  host: string | null
  port: number | null
}

export interface TnsAliasInfo {
  alias: string
  hosts: string[]
  ports: number[]
  protocols: string[]
  serviceName: string | null
  sid: string | null
  addresses: TnsAddress[]
  hasFailover: boolean
  hasMultipleHosts: boolean
}

export interface OracleConnectionSettings {
  id: number
  tnsAdminPath: string
  tnsFileName: string
  tnsAlias: string
  oracleClientLibDir: string
  expectedHost: string
  expectedPort: number | null
  expectedDatabase: string
  username: string
  isEnabled: boolean
  lastValidationStatus: string | null
  lastValidationMessage: string | null
  lastValidatedAt: string | null
  lastConnectedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OracleConfigurationInput {
  tnsAdminPath: string
  tnsFileName?: string
  tnsAlias: string
  oracleClientLibDir: string
  expectedHost: string
  expectedPort: number
  expectedDatabase: string
  username: string
  isEnabled?: boolean
}

export interface StageResult {
  stage: ValidationStage
  ok: boolean
  status: 'success' | 'warning' | 'error' | 'skipped' | 'running'
  message: string
  expected?: string | number | null
  found?: string | number | string[] | number[] | null
  durationMs?: number
  details?: Record<string, unknown>
}

export interface OracleErrorPayload {
  ok: false
  stage: ValidationStage | string
  code: string | null
  message: string
  technicalMessage?: string
  expected?: string | number | null
  found?: string | number | string[] | number[] | null
}

export interface DatabaseSessionInfo {
  sessionUser: string | null
  databaseName: string | null
  serviceName: string | null
  instanceName: string | null
  serverHost: string | null
  containerName: string | null
  oracleVersion: string | null
}

export interface PoolStats {
  connectionsOpen: number
  connectionsInUse: number
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
  pool: PoolStats | null
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
