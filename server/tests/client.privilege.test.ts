import oracledb from 'oracledb'
import { describe, expect, it } from 'vitest'
import { resolvePrivilege } from '../src/oracle/client.js'

describe('resolvePrivilege', () => {
  it('mapeia sysdba/sysoper para as constantes oficiais do driver', () => {
    expect(resolvePrivilege('sysdba')).toBe(oracledb.SYSDBA)
    expect(resolvePrivilege('sysoper')).toBe(oracledb.SYSOPER)
  })

  it('retorna undefined para normal/ausente — nunca concatenado na connectString', () => {
    expect(resolvePrivilege('normal')).toBeUndefined()
    expect(resolvePrivilege(undefined)).toBeUndefined()
    expect(resolvePrivilege(null)).toBeUndefined()
  })
})
