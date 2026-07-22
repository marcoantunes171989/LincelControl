import type { StoreData } from '../types'
import { normalizeCnpj } from './formatters'

const CRLF = '\r\n'

export function buildSqlFileName(store: StoreData): string {
  const codigo = store.codLoja.trim() || '0'
  const cnpj = normalizeCnpj(store.numCgc) || '00000000000000'
  return `update_tab_loja_${codigo}_${cnpj}.sql`
}

export function toCrlf(content: string): string {
  return content.replace(/\r\n|\r|\n/g, CRLF)
}

export function downloadSqlFile(sql: string, fileName: string): void {
  const content = toCrlf(sql)
  const blob = new Blob([content], { type: 'text/sql;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  URL.revokeObjectURL(url)
}
