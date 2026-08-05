export interface CatalogQuery {
  description: string
  sql: string
  allowedBinds: string[]
  maxRows?: number
  requiresConnection?: boolean
}

/**
 * Catálogo de consultas permitidas.
 * O frontend envia apenas queryId + binds autorizados — nunca SQL livre.
 * Consultas de negócio (licenças, clientes) devem ser adicionadas aqui
 * somente após mapear as tabelas reais do Oracle do cliente.
 */
export const queryCatalog: Record<string, CatalogQuery> = {
  'connection-info': {
    description: 'Informações da conexão Oracle',
    sql: `
      SELECT
        SYS_CONTEXT('USERENV', 'SESSION_USER') AS SESSION_USER,
        SYS_CONTEXT('USERENV', 'DB_NAME') AS DATABASE_NAME,
        SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE_NAME,
        SYS_CONTEXT('USERENV', 'INSTANCE_NAME') AS INSTANCE_NAME,
        SYS_CONTEXT('USERENV', 'SERVER_HOST') AS SERVER_HOST,
        SYS_CONTEXT('USERENV', 'CON_NAME') AS CONTAINER_NAME
      FROM DUAL
    `,
    allowedBinds: [],
  },
  'database-datetime': {
    description: 'Data e hora atuais do banco Oracle',
    sql: `
      SELECT
        SYSTIMESTAMP AS SERVER_TIMESTAMP,
        TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS SERVER_DATETIME
      FROM DUAL
    `,
    allowedBinds: [],
  },
  'accessible-tables-count': {
    description: 'Contagem de tabelas acessíveis pelo usuário',
    sql: `
      SELECT COUNT(*) AS TABLE_COUNT
      FROM USER_TABLES
    `,
    allowedBinds: [],
  },
  'schema-tables': {
    description: 'Lista paginada de tabelas do schema do usuário',
    sql: `
      SELECT TABLE_NAME, TABLESPACE_NAME, STATUS
      FROM USER_TABLES
      ORDER BY TABLE_NAME
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `,
    allowedBinds: ['offset', 'limit'],
    maxRows: 100,
  },
  'table-columns': {
    description: 'Colunas de uma tabela do schema do usuário',
    sql: `
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        DATA_LENGTH,
        NULLABLE,
        COLUMN_ID
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = :tableName
      ORDER BY COLUMN_ID
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `,
    allowedBinds: ['tableName', 'offset', 'limit'],
    maxRows: 100,
  },
}

const FORBIDDEN_SQL_TOKENS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'MERGE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'GRANT',
  'REVOKE',
  'COMMIT',
  'ROLLBACK',
  'EXECUTE',
  'BEGIN',
  'DECLARE',
]

export function assertReadOnlySql(sql: string): void {
  const normalized = sql.replace(/--.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').toUpperCase()
  for (const token of FORBIDDEN_SQL_TOKENS) {
    const pattern = new RegExp(`\\b${token}\\b`, 'i')
    if (pattern.test(normalized)) {
      throw new Error(`Comando SQL não permitido detectado: ${token}`)
    }
  }
}

export function getCatalogQuery(queryId: string): CatalogQuery {
  const query = queryCatalog[queryId]
  if (!query) {
    throw new Error(`QueryId não autorizado: ${queryId}`)
  }
  assertReadOnlySql(query.sql)
  return query
}

export function sanitizeBinds(
  query: CatalogQuery,
  binds: Record<string, unknown> | undefined,
  maxRows: number,
): Record<string, unknown> {
  const input = binds ?? {}
  const allowed = new Set(query.allowedBinds)
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      throw new Error(`Bind não autorizado: ${key}`)
    }
  }

  for (const key of query.allowedBinds) {
    if (key === 'offset') {
      const offset = Number(input.offset ?? 0)
      if (!Number.isFinite(offset) || offset < 0) throw new Error('offset inválido')
      result.offset = Math.floor(offset)
      continue
    }
    if (key === 'limit') {
      const requested = Number(input.limit ?? 20)
      if (!Number.isFinite(requested) || requested < 1) throw new Error('limit inválido')
      const hardMax = query.maxRows ?? maxRows
      result.limit = Math.min(Math.floor(requested), hardMax, maxRows)
      continue
    }
    if (key === 'tableName') {
      const tableName = String(input.tableName ?? '').trim().toUpperCase()
      if (!/^[A-Z][A-Z0-9_$#]{0,127}$/.test(tableName)) {
        throw new Error('tableName inválido')
      }
      result.tableName = tableName
      continue
    }
    if (input[key] !== undefined) {
      result[key] = input[key]
    }
  }

  return result
}

/** Placeholders futuros — não inventar tabelas do cliente. */
export const futureQueryIds = [
  'licencas-ativas',
  'licencas-vencidas',
  'licencas-a-vencer',
  'clientes-ativos',
  'clientes-bloqueados',
  'licencas-por-produto',
  'licencas-por-versao',
  'licencas-por-empresa',
  'ativacoes-por-periodo',
  'usuarios-por-cliente',
  'instalacoes-por-servidor',
] as const
