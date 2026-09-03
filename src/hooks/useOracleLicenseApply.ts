import { useCallback, useEffect, useRef, useState } from 'react'
import { oracleApi } from '../api/oracleApi'
import type {
  LicenseUpdateApplyResponse,
  LicenseUpdatePayload,
  LicenseUpdatePreviewResponse,
  OracleRuntimeStatus,
} from '../types/oracle'

export type LicenseApplyPhase =
  | 'idle'
  | 'checking'
  | 'previewing'
  | 'applying'
  | 'done'
  | 'error'

const AGENT_NOT_FOUND_MESSAGE = 'Agente Oracle local não encontrado. Inicie o agente LicenControl na máquina conectada à rede do cliente.'

/**
 * Estado/ações do botão "Aplicar" do Gerador SQL: status da conexão Oracle
 * (sem polling — só atualiza em pontos específicos), preview → modal de
 * confirmação → apply, com proteção contra clique duplo via ref síncrona.
 */
export function useOracleLicenseApply() {
  const [oracleStatus, setOracleStatus] = useState<OracleRuntimeStatus | null>(null)
  const [statusChecked, setStatusChecked] = useState(false)
  const [phase, setPhase] = useState<LicenseApplyPhase>('idle')
  const [preview, setPreview] = useState<LicenseUpdatePreviewResponse | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<LicenseUpdateApplyResponse | null>(null)

  const inFlightRef = useRef(false)
  const pendingPayloadRef = useRef<LicenseUpdatePayload | null>(null)

  const refreshOracleStatus = useCallback(async (): Promise<OracleRuntimeStatus | null> => {
    try {
      const status = await oracleApi.getStatus()
      setOracleStatus(status)
      setStatusChecked(true)
      return status
    } catch {
      setOracleStatus(null)
      setStatusChecked(true)
      return null
    }
  }, [])

  useEffect(() => {
    void refreshOracleStatus()
  }, [refreshOracleStatus])

  const isVercelStub = oracleStatus?.hostMode === 'vercel-stub'
  const oracleConnected = Boolean(oracleStatus?.connected) && !isVercelStub

  const requestPreview = useCallback(
    async (payload: LicenseUpdatePayload): Promise<void> => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      setError(null)
      setPhase('checking')
      try {
        const latestStatus = await refreshOracleStatus()
        if (!latestStatus || latestStatus.hostMode === 'vercel-stub') {
          setError(AGENT_NOT_FOUND_MESSAGE)
          setPhase('error')
          return
        }
        if (!latestStatus.connected) {
          setError('Conecte ao Oracle antes de aplicar.')
          setPhase('error')
          return
        }

        setPhase('previewing')
        pendingPayloadRef.current = payload
        const result = await oracleApi.previewLicenseUpdate(payload)
        setPreview(result)
        setModalOpen(true)
        setPhase('idle')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao pré-validar a atualização no Oracle.')
        setPhase('error')
      } finally {
        inFlightRef.current = false
      }
    },
    [refreshOracleStatus],
  )

  const confirmApply = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return
    const payload = pendingPayloadRef.current
    if (!payload || !preview) return
    if (preview.changedCount === 0) return

    inFlightRef.current = true
    setError(null)
    setPhase('applying')
    try {
      const result = await oracleApi.applyLicenseUpdate({ ...payload, previewToken: preview.previewToken })
      setLastResult(result)
      setModalOpen(false)
      setPreview(null)
      pendingPayloadRef.current = null
      setPhase('done')
      await refreshOracleStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao aplicar a atualização no Oracle.')
      setPhase('error')
    } finally {
      inFlightRef.current = false
    }
  }, [preview, refreshOracleStatus])

  const cancelPreview = useCallback(() => {
    setModalOpen(false)
    setPreview(null)
    pendingPayloadRef.current = null
    setPhase('idle')
  }, [])

  const dismissResult = useCallback(() => {
    setLastResult(null)
  }, [])

  const busy = phase === 'checking' || phase === 'previewing' || phase === 'applying'

  return {
    oracleStatus,
    statusChecked,
    oracleConnected,
    isVercelStub,
    refreshOracleStatus,
    phase,
    busy,
    preview,
    modalOpen,
    error,
    lastResult,
    requestPreview,
    confirmApply,
    cancelPreview,
    dismissResult,
  }
}
