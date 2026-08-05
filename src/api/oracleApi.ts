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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }
  const apiKey = getApiKey()
  if (apiKey) headers.set('X-Admin-Api-Key', apiKey)
  headers.set('X-Actor', 'licencontrol-ui')

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw new Error('API interna indisponível. Execute npm run dev:server na porta 8787.')
  }

  const contentType = response.headers.get('content-type') || ''
  const raw = await response.text()

  // Na Vercel, /api/* pode cair no rewrite do SPA e devolver HTML 200.
  if (contentType.includes('text/html') || raw.trimStart().startsWith('<!')) {
    throw new Error('API Oracle não disponível neste host. Use a API interna (npm run dev:server).')
  }

  let data: unknown = {}
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error(`Resposta inválida da API (${response.status}).`)
    }
  }

  if (!response.ok) {
    const message =
      isPlainObject(data) && typeof data.message === 'string'
        ? data.message
        : `Falha na API (${response.status})`
    throw new Error(message)
  }

  return data as T
}

function assertRuntimeStatus(data: unknown): OracleRuntimeStatus {
  if (!isPlainObject(data) || typeof data.status !== 'string') {
    throw new Error('API Oracle não disponível neste host. Use a API interna (npm run dev:server).')
  }
  return data as unknown as OracleRuntimeStatus
}

export const oracleApi = {
  getStatus: async () => assertRuntimeStatus(await request<unknown>('/api/oracle/status')),
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
  importTns: (content: string, fileName = 'tnsnames.ora') =>
    request<{
      ok: boolean
      message: string
      aliases: TnsAliasInfo[]
      aliasNames: string[]
      tnsAdminPath: string
      tnsFileName: string
      filePath: string
      status: OracleRuntimeStatus
    }>('/api/oracle/tns-import', {
      method: 'POST',
      body: JSON.stringify({ content, fileName }),
    }),
  validateClient: (oracleClientLibDir: string, tnsAdminPath?: string) =>
    request<{
      ok: boolean
      message: string
      clientVersion?: string | null
      ociDllFound?: boolean
      architecture?: string
      libDir?: string
      ociDllPath?: string | null
    }>('/api/oracle/validate-client', {
      method: 'POST',
      body: JSON.stringify({ oracleClientLibDir, tnsAdminPath }),
    }),
  validate: (password?: string) =>
    request<OracleValidateResponse>('/api/oracle/validate', {
      method: 'POST',
      body: JSON.stringify(password ? { password, mode: 'simple' } : { mode: 'simple' }),
    }),
  connect: (
    password?: string,
    identity?: {
      username?: string
      tnsAlias?: string
      oracleClientLibDir?: string
      tnsAdminPath?: string
      tnsFileName?: string
    },
  ) =>
    request<{ ok: boolean; status: OracleRuntimeStatus }>('/api/oracle/connect', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'simple',
        ...(password ? { password } : {}),
        ...(identity?.username ? { username: identity.username } : {}),
        ...(identity?.tnsAlias ? { tnsAlias: identity.tnsAlias } : {}),
        ...(identity?.oracleClientLibDir !== undefined
          ? { oracleClientLibDir: identity.oracleClientLibDir }
          : {}),
        ...(identity?.tnsAdminPath !== undefined ? { tnsAdminPath: identity.tnsAdminPath } : {}),
        ...(identity?.tnsFileName ? { tnsFileName: identity.tnsFileName } : {}),
      }),
    }),
  disconnect: () =>
    request<{ ok: boolean; status: OracleRuntimeStatus }>('/api/oracle/disconnect', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  toggle: (enabled: boolean, password?: string) =>
    request<{ ok: boolean; status: OracleRuntimeStatus }>('/api/oracle/toggle', {
      method: 'POST',
      body: JSON.stringify(enabled ? { enabled: true, password, mode: 'simple' } : { enabled: false }),
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
