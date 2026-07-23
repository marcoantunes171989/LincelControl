const CNPJ_WS_BASE_URL = 'https://publica.cnpj.ws/cnpj'

interface CnpjWsInscricaoEstadual {
  inscricao_estadual?: string
  numero?: string
  ativo?: boolean
  estado?: { sigla?: string } | string
}

interface CnpjWsResponse {
  estabelecimento?: {
    inscricoes_estaduais?: CnpjWsInscricaoEstadual[]
  }
  inscricoes_estaduais?: CnpjWsInscricaoEstadual[]
}

export interface CnpjLookupResult {
  /** true quando o CNPJ foi encontrado na Receita Federal (via API pública). */
  cnpjFound: boolean
  /** Inscrições estaduais formatadas ("UF: número | UF: número"), ou string vazia se não houver nenhuma. */
  inscricaoEstadual: string
}

function formatInscricoesEstaduais(items: CnpjWsInscricaoEstadual[] | undefined): string {
  if (!Array.isArray(items) || items.length === 0) return ''

  const activeOnly = items.filter((item) => item.ativo !== false)
  const source = activeOnly.length > 0 ? activeOnly : items

  return source
    .map((item) => {
      const estado = typeof item.estado === 'string' ? item.estado : item.estado?.sigla
      const numero = item.inscricao_estadual || item.numero
      if (!numero) return ''
      return estado ? `${estado}: ${numero}` : numero
    })
    .filter(Boolean)
    .join(' | ')
}

/** Consulta a API pública CNPJ.ws para localizar as inscrições estaduais de um CNPJ (somente dígitos). */
export async function lookupInscricaoEstadual(cnpjDigits: string, signal: AbortSignal): Promise<CnpjLookupResult> {
  const response = await fetch(`${CNPJ_WS_BASE_URL}/${cnpjDigits}`, { signal })

  if (!response.ok) {
    return { cnpjFound: false, inscricaoEstadual: '' }
  }

  const json = (await response.json().catch(() => null)) as CnpjWsResponse | null
  if (!json || typeof json !== 'object') {
    return { cnpjFound: false, inscricaoEstadual: '' }
  }

  const items = json.estabelecimento?.inscricoes_estaduais ?? json.inscricoes_estaduais
  return { cnpjFound: true, inscricaoEstadual: formatInscricoesEstaduais(items) }
}
