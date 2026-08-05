import { describe, expect, it } from 'vitest'
import { translateOracleError } from '../src/oracle/errors.js'

describe('translateOracleError', () => {
  it('traduz ORA-01017', () => {
    const result = translateOracleError(new Error('ORA-01017: invalid username/password; logon denied'))
    expect(result.code).toBe('ORA-01017')
    expect(result.message).toMatch(/usuário ou senha/i)
  })

  it('traduz DPI-1047', () => {
    const result = translateOracleError(new Error('DPI-1047: Cannot locate a 64-bit Oracle Client library'), 'oracle-client')
    expect(result.code).toBe('DPI-1047')
    expect(result.stage).toBe('oracle-client')
  })

  it('traduz conta bloqueada e senha expirada', () => {
    expect(translateOracleError(new Error('ORA-28000: the account is locked')).message).toMatch(/bloqueada/i)
    expect(translateOracleError(new Error('ORA-28001: the password has expired')).message).toMatch(/expirada/i)
  })

  it('traduz erros de listener', () => {
    expect(translateOracleError(new Error('ORA-12541: TNS:no listener')).message).toMatch(/listener/i)
    expect(translateOracleError(new Error('ORA-12514: TNS:listener does not currently know of service')).message).toMatch(
      /SERVICE_NAME/i,
    )
  })
})
