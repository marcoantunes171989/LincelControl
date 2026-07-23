import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupCnpj } from '../utils/cnpjLookup'

function mockFetchOnce(response: Partial<Response> & { jsonBody?: unknown }) {
  const { jsonBody, ...rest } = response
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => jsonBody,
      ...rest,
    }),
  )
}

describe('lookupCnpj', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retorna a inscrição estadual ativa encontrada', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: {
        estabelecimento: {
          inscricoes_estaduais: [{ inscricao_estadual: '123.456.789.114', ativo: true, estado: { sigla: 'SP' } }],
        },
      },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.cnpjFound).toBe(true)
    expect(result.inscricaoEstadual).toBe('SP: 123.456.789.114')
  })

  it('junta múltiplas inscrições estaduais ativas separadas por "|"', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: {
        estabelecimento: {
          inscricoes_estaduais: [
            { inscricao_estadual: '111', ativo: true, estado: { sigla: 'SP' } },
            { inscricao_estadual: '222', ativo: true, estado: { sigla: 'RJ' } },
          ],
        },
      },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.inscricaoEstadual).toBe('SP: 111 | RJ: 222')
  })

  it('retorna string vazia quando não há inscrições estaduais', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: { estabelecimento: { inscricoes_estaduais: [] } },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.cnpjFound).toBe(true)
    expect(result.inscricaoEstadual).toBe('')
  })

  it('retorna cnpjFound false quando a API responde com erro', async () => {
    mockFetchOnce({ ok: false, jsonBody: null })

    const result = await lookupCnpj('00000000000000', new AbortController().signal)
    expect(result.cnpjFound).toBe(false)
    expect(result.inscricaoEstadual).toBe('')
    expect(result.razaoSocial).toBe('')
  })

  it('ignora inscrições inativas quando existe ao menos uma ativa', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: {
        estabelecimento: {
          inscricoes_estaduais: [
            { inscricao_estadual: '999', ativo: false, estado: { sigla: 'MG' } },
            { inscricao_estadual: '111', ativo: true, estado: { sigla: 'SP' } },
          ],
        },
      },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.inscricaoEstadual).toBe('SP: 111')
  })

  it('retorna a razão social encontrada', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: { razao_social: 'JACI SUPERMERCADOS LTDA', estabelecimento: { inscricoes_estaduais: [] } },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.razaoSocial).toBe('JACI SUPERMERCADOS LTDA')
  })

  it('usa o nome fantasia quando a razão social não vem preenchida', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: { estabelecimento: { nome_fantasia: 'JACI MERCADO', inscricoes_estaduais: [] } },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.razaoSocial).toBe('JACI MERCADO')
  })

  it('retorna razão social vazia quando não encontrada', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: { estabelecimento: { inscricoes_estaduais: [] } },
    })

    const result = await lookupCnpj('02274225000161', new AbortController().signal)
    expect(result.razaoSocial).toBe('')
  })
})
