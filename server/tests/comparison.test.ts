import { describe, expect, it } from 'vitest'
import { compareTnsWithExpected } from '../src/oracle/comparison.js'
import type { TnsAliasInfo } from '../src/oracle/types.js'

const baseAlias: TnsAliasInfo = {
  alias: 'CLIENTE_PRODUCAO',
  hosts: ['192.168.0.10'],
  ports: [1521],
  protocols: ['TCP'],
  serviceName: 'ORCL',
  sid: null,
  addresses: [{ protocol: 'TCP', host: '192.168.0.10', port: 1521 }],
  hasFailover: false,
  hasMultipleHosts: false,
}

describe('compareTnsWithExpected', () => {
  it('aceita correspondência exata', () => {
    const result = compareTnsWithExpected(baseAlias, {
      host: '192.168.0.10',
      port: 1521,
      database: 'ORCL',
    })
    expect(result.ok).toBe(true)
  })

  it('detecta HOST divergente', () => {
    const result = compareTnsWithExpected(baseAlias, {
      host: '192.168.0.20',
      port: 1521,
      database: 'ORCL',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/HOST/i)
    expect(result.expected).toBe('192.168.0.20')
    expect(result.found).toEqual(['192.168.0.10'])
  })

  it('detecta porta inválida/divergente', () => {
    const result = compareTnsWithExpected(baseAlias, {
      host: '192.168.0.10',
      port: 1522,
      database: 'ORCL',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/PORT/i)
  })

  it('detecta banco divergente', () => {
    const result = compareTnsWithExpected(baseAlias, {
      host: '192.168.0.10',
      port: 1521,
      database: 'XE',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/SERVICE_NAME|SID/i)
  })

  it('aceita SID quando não há SERVICE_NAME', () => {
    const alias: TnsAliasInfo = {
      ...baseAlias,
      serviceName: null,
      sid: 'XE',
    }
    expect(
      compareTnsWithExpected(alias, {
        host: '192.168.0.10',
        port: 1521,
        database: 'XE',
      }).ok,
    ).toBe(true)
  })
})
