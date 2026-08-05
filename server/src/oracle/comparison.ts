import type { TnsAliasInfo } from './types.js'

export interface ComparisonResult {
  ok: boolean
  message: string
  expected?: string | number | null
  found?: string | number | string[] | number[] | null
  warning?: boolean
}

export function compareTnsWithExpected(
  alias: TnsAliasInfo,
  expected: { host: string; port: number; database: string },
): ComparisonResult {
  const hostMatch = alias.hosts.some((host) => host.toLowerCase() === expected.host.trim().toLowerCase())
  if (!hostMatch) {
    return {
      ok: false,
      message: 'O HOST encontrado no TNS é diferente do HOST informado.',
      expected: expected.host,
      found: alias.hosts,
    }
  }

  const portMatch = alias.ports.includes(Number(expected.port))
  if (!portMatch) {
    return {
      ok: false,
      message: 'A PORT encontrada no TNS é diferente da PORT informada.',
      expected: expected.port,
      found: alias.ports,
    }
  }

  const expectedDb = expected.database.trim().toUpperCase()
  const foundDb = (alias.serviceName || alias.sid || '').toUpperCase()
  if (!foundDb || foundDb !== expectedDb) {
    return {
      ok: false,
      message: 'O SERVICE_NAME/SID encontrado no TNS é diferente do banco informado.',
      expected: expected.database,
      found: alias.serviceName || alias.sid,
    }
  }

  return {
    ok: true,
    warning: alias.hasMultipleHosts || alias.hasFailover,
    message:
      alias.hasMultipleHosts || alias.hasFailover
        ? 'Dados do TNS conferem. Alias possui múltiplos hosts/failover.'
        : 'HOST, PORT e banco conferem com o TNS.',
    expected: `${expected.host}:${expected.port}/${expected.database}`,
    found: `${alias.hosts.join(',')}:${alias.ports.join(',')}/${foundDb}`,
  }
}
