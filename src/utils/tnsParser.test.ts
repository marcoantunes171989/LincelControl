import { describe, expect, it } from 'vitest'
import { findTnsAlias, parseTnsNames } from './tnsParser'

const SAMPLE = `
CLIENTE_PRODUCAO =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.0.10)(PORT = 1521))
    (CONNECT_DATA = (SERVICE_NAME = ORCL))
  )
`

describe('parseTnsNames (frontend)', () => {
  it('extrai alias HOST PORT SERVICE_NAME', () => {
    const aliases = parseTnsNames(SAMPLE)
    expect(aliases).toHaveLength(1)
    expect(findTnsAlias(SAMPLE, 'CLIENTE_PRODUCAO')).toMatchObject({
      alias: 'CLIENTE_PRODUCAO',
      hosts: ['192.168.0.10'],
      ports: [1521],
      serviceName: 'ORCL',
    })
  })
})
