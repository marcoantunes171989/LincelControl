import type {
  OracleConfigurationPayload,
  OracleRuntimeStatus,
  OracleValidateResponse,
  TnsAliasInfo,
} from '../types/oracle'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || ''

function getApiKey(): string {
  return (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) || ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  const apiKey = getApiKey()
  if (apiKey) headers.set('X-Admin-Api-Key', apiKey)
  headers.set('X-Actor', 'licencontrol-ui')

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const data = (await response.json().catch(() => ({}))) as T & { message?: string; ok?: boolean }
  if (!response.ok) {
    throw new Error(data.message || `Falha na API (${response.status})`)
  }
  return data
}

export const oracleApi = {
  getStatus: () => request<OracleRuntimeStatus>('/api/oracle/status'),
  getConfiguration: () =>
    request<{ ok: boolean; configuration: OracleConfigurationPayload | null }>('/api/oracle/configuration'),
  saveConfiguration: (payload: OracleConfigurationPayload) =>
    request<{ ok: boolean; configuration: OracleConfigurationPayload }>('/api/oracle/configuration', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listAliases: (tnsAdminPath: string, tnsFileName: string) =>
    request<{ ok: boolean; aliases: string[]; filePath: string }>('/api/oracle/tns-aliases', {
      method: 'POST',
      body: JSON.stringify({ tnsAdminPath, tnsFileName }),
    }),
  parseAlias: (tnsAdminPath: string, tnsFileName: string, tnsAlias: string) =>
    request<{ ok: boolean; alias: TnsAliasInfo }>('/api/oracle/tns-parse', {
      method: 'POST',
      body: JSON.stringify({ tnsAdminPath, tnsFileName, tnsAlias }),
    }),
  validateClient: (oracleClientLibDir: string, tnsAdminPath?: string) =>
    request<{ ok: boolean; message: string; clientVersion?: string | null; ociDllFound?: boolean }>(
      '/api/oracle/validate-client',
      {
        method: 'POST',
        body: JSON.stringify({ oracleClientLibDir, tnsAdminPath }),
      },
    ),
  validate: (password?: string) =>
    request<OracleValidateResponse>('/api/oracle/validate', {
      method: 'POST',
      body: JSON.stringify(password ? { password } : {}),
    }),
  connect: (password?: string) =>
    request<{ ok: boolean; status: OracleRuntimeStatus }>('/api/oracle/connect', {
      method: 'POST',
      body: JSON.stringify(password ? { password } : {}),
    }),
  disconnect: () =>
    request<{ ok: boolean; status: OracleRuntimeStatus }>('/api/oracle/disconnect', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  toggle: (enabled: boolean, password?: string) =>
    request<{ ok: boolean; status: OracleRuntimeStatus }>('/api/oracle/toggle', {
      method: 'POST',
      body: JSON.stringify(enabled ? { enabled: true, password } : { enabled: false }),
    }),
  query: (queryId: string, binds?: Record<string, unknown>) =>
    request<{ ok: boolean; rows: Record<string, unknown>[]; durationMs: number }>('/api/oracle/query', {
      method: 'POST',
      body: JSON.stringify({ queryId, binds }),
    }),
  health: () =>
    request<{ service: string; status: string; configured: boolean; connected: boolean; checkedAt: string }>(
      '/api/oracle/health',
    ),
}
