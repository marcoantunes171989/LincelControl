import { describe, expect, it } from 'vitest'
import { normalizeOracleClientDir } from './oracleClientPath'

describe('normalizeOracleClientDir', () => {
  it('mantém pasta do client', () => {
    expect(normalizeOracleClientDir('C:\\Oracle\\instantclient_19_25')).toBe('C:\\Oracle\\instantclient_19_25')
  })

  it('remove OCI.DLL do caminho', () => {
    expect(normalizeOracleClientDir('C:\\oracle\\app\\product\\11.2.0\\client_1\\BIN\\oci.dll')).toBe(
      'C:\\oracle\\app\\product\\11.2.0\\client_1\\BIN',
    )
  })

  it('remove oci.d truncado', () => {
    expect(normalizeOracleClientDir('C:\\oracle\\app\\product\\11.2.0\\client_1\\BIN\\oci.d')).toBe(
      'C:\\oracle\\app\\product\\11.2.0\\client_1\\BIN',
    )
  })
})
