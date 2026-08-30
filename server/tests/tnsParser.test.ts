import { describe, expect, it } from 'vitest'
import { findTnsAlias, listTnsAliases, parseTnsNames } from '../src/oracle/tnsParser.js'

const SAMPLE = `
# Comentário inicial
CLIENTE_PRODUCAO =
  (DESCRIPTION =
    (ADDRESS =
      (PROTOCOL = TCP)
      (HOST = 192.168.0.10)
      (PORT = 1521)
    )
    (CONNECT_DATA =
      (SERVICE_NAME = ORCL)
    )
  )

CLIENTE_SID =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = db.local)(PORT = 1522))
    (CONNECT_DATA = (SID = XE))
  )

CLIENTE_FAILOVER =
  (DESCRIPTION =
    (FAILOVER = ON)
    (ADDRESS_LIST =
      (ADDRESS = (PROTOCOL = TCP)(HOST = 10.0.0.1)(PORT = 1521))
      (ADDRESS = (PROTOCOL = TCP)(HOST = 10.0.0.2)(PORT = 1521))
    )
    (CONNECT_DATA = (SERVICE_NAME = PROD))
  )
`

describe('parseTnsNames', () => {
  it('parseia alias simples com SERVICE_NAME', () => {
    const alias = findTnsAlias(SAMPLE, 'CLIENTE_PRODUCAO')
    expect(alias).toMatchObject({
      alias: 'CLIENTE_PRODUCAO',
      hosts: ['192.168.0.10'],
      ports: [1521],
      protocols: ['TCP'],
      serviceName: 'ORCL',
      sid: null,
    })
  })

  it('parseia alias com SID', () => {
    const alias = findTnsAlias(SAMPLE, 'CLIENTE_SID')
    expect(alias?.sid).toBe('XE')
    expect(alias?.serviceName).toBeNull()
    expect(alias?.ports).toEqual([1522])
  })

  it('parseia múltiplos ADDRESS e failover', () => {
    const alias = findTnsAlias(SAMPLE, 'CLIENTE_FAILOVER')
    expect(alias?.hosts).toEqual(['10.0.0.1', '10.0.0.2'])
    expect(alias?.hasMultipleHosts).toBe(true)
    expect(alias?.hasFailover).toBe(true)
    expect(alias?.serviceName).toBe('PROD')
  })

  it('diferencia aliases semelhantes', () => {
    const content = `
CLIENTE =
  (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=a)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=A)))
CLIENTE_2 =
  (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=b)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=B)))
`
    expect(findTnsAlias(content, 'CLIENTE')?.hosts).toEqual(['a'])
    expect(findTnsAlias(content, 'CLIENTE_2')?.hosts).toEqual(['b'])
  })

  it('ignora comentários', () => {
    const content = `
# CLIENTE_FAKE = (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=x)(PORT=1))(CONNECT_DATA=(SID=X)))
REAL =
  (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=y)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=Y)))
`
    expect(listTnsAliases(content)).toEqual(['REAL'])
  })

  it('lista todos os aliases', () => {
    expect(listTnsAliases(SAMPLE)).toEqual(['CLIENTE_PRODUCAO', 'CLIENTE_SID', 'CLIENTE_FAILOVER'])
  })

  it('retorna null para alias inexistente', () => {
    expect(findTnsAlias(SAMPLE, 'NAO_EXISTE')).toBeNull()
  })

  it('parseia blocos com parênteses aninhados', () => {
    const aliases = parseTnsNames(SAMPLE)
    expect(aliases).toHaveLength(3)
    expect(aliases[0].addresses[0]).toEqual({
      protocol: 'TCP',
      host: '192.168.0.10',
      port: 1521,
    })
  })

  it('fixture de homologação: ORCL / 192.168.0.238 / 1521 / orcl.intersoul', () => {
    const HOMOLOGACAO_TNS = `
ORCL =
(DESCRIPTION =
  (ADDRESS =
    (PROTOCOL = TCP)
    (HOST = 192.168.0.238)
    (PORT = 1521)
  )
  (CONNECT_DATA =
    (SERVER = DEDICATED)
    (SERVICE_NAME = orcl.intersoul)
  )
)
`
    const alias = findTnsAlias(HOMOLOGACAO_TNS, 'ORCL')
    expect(alias).toMatchObject({
      alias: 'ORCL',
      hosts: ['192.168.0.238'],
      ports: [1521],
      serviceName: 'orcl.intersoul',
      sid: null,
    })
  })
})
