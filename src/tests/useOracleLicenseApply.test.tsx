import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { oracleApi } from '../api/oracleApi'
import { useOracleLicenseApply } from '../hooks/useOracleLicenseApply'
import type {
  LicenseUpdateApplyResponse,
  LicenseUpdatePayload,
  LicenseUpdatePreviewResponse,
  OracleRuntimeStatus,
} from '../types/oracle'

vi.mock('../api/oracleApi', () => ({
  oracleApi: {
    getStatus: vi.fn(),
    previewLicenseUpdate: vi.fn(),
    applyLicenseUpdate: vi.fn(),
  },
}))

const mockedApi = vi.mocked(oracleApi, true)

function connectedStatus(overrides: Partial<OracleRuntimeStatus> = {}): OracleRuntimeStatus {
  return {
    configured: true,
    enabled: true,
    connected: true,
    status: 'connected',
    passwordAvailableInMemory: true,
    clientInitialized: true,
    clientVersion: 'oracledb-thin',
    clientArchitecture: 'x64',
    ociDllFound: false,
    pool: { connectionsOpen: 1, connectionsInUse: 0 },
    database: {
      alias: 'ORCL',
      host: '192.168.0.238',
      port: 1521,
      serviceName: 'orcl.intersoul',
      sid: null,
      instanceName: null,
      serverHost: null,
      databaseName: null,
      sessionUser: 'INTERSOLID',
      oracleVersion: null,
    },
    paths: { tnsAdminPath: null, tnsFileName: null, oracleClientLibDir: null },
    lastValidatedAt: null,
    lastConnectedAt: null,
    lastValidationDurationMs: null,
    lastError: null,
    stages: [],
    ...overrides,
  }
}

const PAYLOAD: LicenseUpdatePayload = {
  store: { codLoja: '1', numCgc: '02274225000161', descricao: 'Loja Teste' },
  license: {
    numLicenca: '9090',
    numDiaVencto: '5',
    numPdv: '100',
    numPdvBalcao: '1',
    numPdvReserva: '0',
    numPdvRecebto: '1',
  },
  modules: {},
  nfeExpertMode: 'nenhuma',
}

function previewResponse(overrides: Partial<LicenseUpdatePreviewResponse> = {}): LicenseUpdatePreviewResponse {
  return {
    ok: true,
    previewToken: 'token.signature',
    store: { codLoja: 1, cnpj: '02274225000161', descricao: 'Loja Teste' },
    database: { alias: 'ORCL', host: '192.168.0.238', port: 1521, serviceName: 'orcl.intersoul', username: 'INTERSOLID' },
    changedFields: [{ field: 'NUM_LICENCA', oldValue: 1, newValue: 9090 }],
    changedCount: 1,
    message: '1 campo(s) serão alterados.',
    ...overrides,
  }
}

function applyResponse(overrides: Partial<LicenseUpdateApplyResponse> = {}): LicenseUpdateApplyResponse {
  return {
    ok: true,
    verified: true,
    store: { codLoja: 1, cnpj: '02274225000161', descricao: 'Loja Teste' },
    database: { alias: 'ORCL', host: '192.168.0.238', port: 1521, serviceName: 'orcl.intersoul', username: 'INTERSOLID' },
    changedFields: [{ field: 'NUM_LICENCA', oldValue: 1, newValue: 9090 }],
    changedCount: 1,
    rowsAffected: 1,
    durationMs: 42,
    appliedAt: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useOracleLicenseApply', () => {
  it('carrega o status Oracle ao montar (sem polling)', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    const { result } = renderHook(() => useOracleLicenseApply())

    await waitFor(() => expect(result.current.statusChecked).toBe(true))
    expect(result.current.oracleConnected).toBe(true)
    expect(mockedApi.getStatus).toHaveBeenCalledTimes(1)
  })

  it('bloqueia o preview e orienta o usuário quando o Oracle está desconectado', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus({ connected: false, status: 'disconnected' }))
    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))

    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    expect(result.current.error).toMatch(/conecte ao oracle/i)
    expect(mockedApi.previewLicenseUpdate).not.toHaveBeenCalled()
    expect(result.current.modalOpen).toBe(false)
  })

  it('avisa quando não há agente Oracle local (stub da Vercel)', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus({ hostMode: 'vercel-stub', connected: false }))
    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))

    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    expect(result.current.error).toMatch(/agente oracle local não encontrado/i)
    expect(mockedApi.previewLicenseUpdate).not.toHaveBeenCalled()
  })

  it('preview com sucesso abre o modal de confirmação com as alterações', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse())
    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))

    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    expect(result.current.modalOpen).toBe(true)
    expect(result.current.preview?.changedCount).toBe(1)
  })

  it('cancelar fecha o modal sem chamar apply', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse())
    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))
    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    act(() => result.current.cancelPreview())

    expect(result.current.modalOpen).toBe(false)
    expect(result.current.preview).toBeNull()
    expect(mockedApi.applyLicenseUpdate).not.toHaveBeenCalled()
  })

  it('confirmar chama a API de apply com o previewToken e retorna o resultado', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse())
    mockedApi.applyLicenseUpdate.mockResolvedValue(applyResponse())

    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))
    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    await act(async () => {
      await result.current.confirmApply()
    })

    expect(mockedApi.applyLicenseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ previewToken: 'token.signature' }),
    )
    expect(result.current.lastResult?.rowsAffected).toBe(1)
    expect(result.current.modalOpen).toBe(false)
  })

  it('erro no apply é exposto sem travar o hook', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse())
    mockedApi.applyLicenseUpdate.mockRejectedValue(new Error('ORA-00054: recurso ocupado'))

    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))
    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })
    await act(async () => {
      await result.current.confirmApply()
    })

    expect(result.current.error).toMatch(/recurso ocupado/i)
    expect(result.current.lastResult).toBeNull()
  })

  it('não confirma quando não há campos alterados (changedCount = 0)', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse({ changedCount: 0, changedFields: [] }))

    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))
    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    await act(async () => {
      await result.current.confirmApply()
    })

    expect(mockedApi.applyLicenseUpdate).not.toHaveBeenCalled()
  })

  it('clique duplo dispara apenas uma chamada de preview', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse())

    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))

    await act(async () => {
      await Promise.all([result.current.requestPreview(PAYLOAD), result.current.requestPreview(PAYLOAD)])
    })

    expect(mockedApi.previewLicenseUpdate).toHaveBeenCalledTimes(1)
  })

  it('clique duplo em confirmar dispara apenas uma chamada de apply', async () => {
    mockedApi.getStatus.mockResolvedValue(connectedStatus())
    mockedApi.previewLicenseUpdate.mockResolvedValue(previewResponse())
    mockedApi.applyLicenseUpdate.mockResolvedValue(applyResponse())

    const { result } = renderHook(() => useOracleLicenseApply())
    await waitFor(() => expect(result.current.statusChecked).toBe(true))
    await act(async () => {
      await result.current.requestPreview(PAYLOAD)
    })

    await act(async () => {
      await Promise.all([result.current.confirmApply(), result.current.confirmApply()])
    })

    expect(mockedApi.applyLicenseUpdate).toHaveBeenCalledTimes(1)
  })
})
