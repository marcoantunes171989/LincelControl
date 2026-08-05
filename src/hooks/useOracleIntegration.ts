import { useCallback, useEffect, useState } from 'react'
import { oracleApi } from '../api/oracleApi'
import {
  EMPTY_ORACLE_FORM,
  type OracleFormState,
  type OracleRuntimeStatus,
  type StageResult,
  type TnsAliasInfo,
} from '../types/oracle'

export function useOracleIntegration() {
  const [form, setForm] = useState<OracleFormState>(EMPTY_ORACLE_FORM)
  const [status, setStatus] = useState<OracleRuntimeStatus | null>(null)
  const [aliases, setAliases] = useState<string[]>([])
  const [selectedAliasInfo, setSelectedAliasInfo] = useState<TnsAliasInfo | null>(null)
  const [stages, setStages] = useState<StageResult[]>([])
  const [progress, setProgress] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [apiReachable, setApiReachable] = useState<boolean | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const next = await oracleApi.getStatus()
      setStatus(next)
      setStages(Array.isArray(next.stages) ? next.stages : [])
      setApiReachable(true)
      setError(null)
      return next
    } catch (err) {
      setStatus(null)
      setStages([])
      setApiReachable(false)
      setError(err instanceof Error ? err.message : 'API Oracle indisponível')
      return null
    }
  }, [])

  const loadConfiguration = useCallback(async () => {
    try {
      const response = await oracleApi.getConfiguration()
      const config = response.configuration
      if (config) {
        setForm((current) => ({
          ...current,
          tnsAdminPath: config.tnsAdminPath || '',
          tnsFileName: config.tnsFileName || 'tnsnames.ora',
          tnsAlias: config.tnsAlias || '',
          oracleClientLibDir: config.oracleClientLibDir || '',
          expectedHost: config.expectedHost || '',
          expectedPort: config.expectedPort ? String(config.expectedPort) : '1521',
          expectedDatabase: config.expectedDatabase || '',
          username: config.username || '',
          password: current.password,
        }))
      }
    } catch {
      /* API offline */
    }
    await refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    void loadConfiguration()
  }, [loadConfiguration])

  const updateField = useCallback(<K extends keyof OracleFormState>(field: K, value: OracleFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const toPayload = useCallback(
    () => ({
      tnsAdminPath: form.tnsAdminPath.trim(),
      tnsFileName: form.tnsFileName.trim() || 'tnsnames.ora',
      tnsAlias: form.tnsAlias.trim(),
      oracleClientLibDir: form.oracleClientLibDir.trim(),
      expectedHost: form.expectedHost.trim(),
      expectedPort: form.expectedPort ? Number.parseInt(form.expectedPort, 10) || null : null,
      expectedDatabase: form.expectedDatabase.trim(),
      username: form.username.trim(),
    }),
    [form],
  )

  const loadAliases = useCallback(async () => {
    if (!form.tnsAdminPath.trim()) {
      setError('Informe o caminho do TNS_ADMIN nas opções avançadas para listar os aliases.')
      setShowAdvanced(true)
      return []
    }
    setBusy(true)
    setError(null)
    try {
      const result = await oracleApi.listAliases(form.tnsAdminPath, form.tnsFileName || 'tnsnames.ora')
      setAliases(result.aliases)
      return result.aliases
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ler aliases TNS')
      throw err
    } finally {
      setBusy(false)
    }
  }, [form.tnsAdminPath, form.tnsFileName])

  /** Conectar como no PL/SQL Developer: Username + Password + Database (TNS). */
  const logon = useCallback(async (): Promise<boolean> => {
    if (!form.username.trim() || !form.tnsAlias.trim()) {
      setError('Informe Username e Database (alias TNS).')
      return false
    }
    if (!form.password && !status?.passwordAvailableInMemory) {
      setError('Informe a Password.')
      return false
    }

    setBusy(true)
    setError(null)
    setProgress('Conectando ao Oracle...')
    try {
      await oracleApi.saveConfiguration(toPayload())
      const result = await oracleApi.connect(form.password || undefined, {
        username: form.username.trim(),
        tnsAlias: form.tnsAlias.trim(),
      })
      setStatus(result.status)
      setStages(result.status.stages ?? [])
      setForm((current) => ({ ...current, password: '' }))
      setProgress(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no logon Oracle')
      setProgress(null)
      await refreshStatus()
      return false
    } finally {
      setBusy(false)
    }
  }, [form.password, form.tnsAlias, form.username, refreshStatus, status?.passwordAvailableInMemory, toPayload])

  const logoff = useCallback(async (): Promise<boolean> => {
    setBusy(true)
    setError(null)
    setProgress('Desconectando...')
    try {
      const result = await oracleApi.disconnect()
      setStatus(result.status)
      setStages(result.status.stages ?? [])
      setProgress(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desconectar')
      setProgress(null)
      await refreshStatus()
      return false
    } finally {
      setBusy(false)
    }
  }, [refreshStatus])

  const saveAdvanced = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await oracleApi.saveConfiguration(toPayload())
      await refreshStatus()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar ambiente')
      return false
    } finally {
      setBusy(false)
    }
  }, [refreshStatus, toPayload])

  return {
    form,
    status,
    aliases,
    selectedAliasInfo,
    stages,
    progress,
    busy,
    error,
    showPassword,
    showAdvanced,
    apiReachable,
    setShowPassword,
    setShowAdvanced,
    setError,
    updateField,
    refreshStatus,
    loadAliases,
    logon,
    logoff,
    saveAdvanced,
    setSelectedAliasInfo,
  }
}
