import { describe, expect, it } from 'vitest'
import { assertReadOnlySql, getCatalogQuery, sanitizeBinds } from '../src/oracle/queryCatalog.js'

describe('queryCatalog', () => {
  it('rejeita queryId não autorizado', () => {
    expect(() => getCatalogQuery('drop-everything')).toThrow(/não autorizado/i)
  })

  it('rejeita bind não autorizado', () => {
    const query = getCatalogQuery('schema-tables')
    expect(() => sanitizeBinds(query, { offset: 0, limit: 10, evil: 'x' }, 100)).toThrow(/Bind não autorizado/i)
  })

  it('aplica paginação com limite máximo', () => {
    const query = getCatalogQuery('schema-tables')
    const binds = sanitizeBinds(query, { offset: 5, limit: 500 }, 100)
    expect(binds).toEqual({ offset: 5, limit: 100 })
  })

  it('valida tableName', () => {
    const query = getCatalogQuery('table-columns')
    expect(() => sanitizeBinds(query, { tableName: 'users; drop', offset: 0, limit: 10 }, 100)).toThrow(
      /tableName inválido/i,
    )
    expect(sanitizeBinds(query, { tableName: 'TAB_LOJA', offset: 0, limit: 10 }, 100).tableName).toBe('TAB_LOJA')
  })

  it('bloqueia SQL de escrita', () => {
    expect(() => assertReadOnlySql('DELETE FROM dual')).toThrow(/DELETE/i)
    expect(() => assertReadOnlySql('BEGIN NULL; END;')).toThrow(/BEGIN/i)
  })
})
