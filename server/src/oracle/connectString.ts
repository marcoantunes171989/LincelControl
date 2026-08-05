import type { TnsAliasInfo } from './types.js'

export interface ConnectTarget {
  host?: string | null
  port?: number | null
  serviceName?: string | null
  sid?: string | null
  tnsAlias?: string | null
}

/**
 * Monta connectString para o driver Thin (Easy Connect / descriptor).
 * Prefere HOST:PORT/SERVICE_NAME; para SID usa descriptor completo.
 */
export function buildConnectString(target: ConnectTarget, alias?: TnsAliasInfo | null): string {
  const host = (target.host || alias?.hosts[0] || '').trim()
  const port = target.port || alias?.ports[0] || 1521
  const serviceName = (target.serviceName || alias?.serviceName || '').trim()
  const sid = (target.sid || (!serviceName ? alias?.sid : null) || '').trim()

  if (host && serviceName) {
    return `${host}:${port}/${serviceName}`
  }

  if (host && sid) {
    return (
      `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=${port}))` +
      `(CONNECT_DATA=(SID=${sid})))`
    )
  }

  const aliasName = (target.tnsAlias || '').trim()
  if (aliasName) {
    return aliasName
  }

  throw Object.assign(
    new Error('Informe HOST/PORT/SERVICE_NAME (via TNS importado) para conectar no modo Thin.'),
    { statusCode: 400 },
  )
}
