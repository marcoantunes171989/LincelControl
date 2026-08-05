import { describe, expect, it } from 'vitest'
import { buildConnectString } from '../src/oracle/connectString.js'

describe('buildConnectString', () => {
  it('monta Easy Connect com SERVICE_NAME', () => {
    expect(
      buildConnectString({
        host: '172.26.3.2',
        port: 1521,
        serviceName: 'orcl',
        tnsAlias: 'ORCL',
      }),
    ).toBe('172.26.3.2:1521/orcl')
  })

  it('monta descriptor com SID', () => {
    const value = buildConnectString({
      host: 'db.local',
      port: 1522,
      sid: 'XE',
    })
    expect(value).toContain('(SID=XE)')
    expect(value).toContain('(HOST=db.local)')
  })

  it('usa expectedDatabase como service quando não há sid', () => {
    expect(
      buildConnectString({
        host: '10.0.0.1',
        port: 1521,
        serviceName: 'ORCL',
      }),
    ).toBe('10.0.0.1:1521/ORCL')
  })
})
