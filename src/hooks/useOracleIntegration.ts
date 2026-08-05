import { useCallback, useEffect, useState } from 'react'
import { oracleApi } from '../api/oracleApi'
import {
  EMPTY_ORACLE_FORM,
  type OracleFormState,
  type OracleRuntimeStatus,
  type StageResult,
  type TnsAliasInfo,
} from '../types/oracle'

export interface ClientValidationResult {
  ok: boolean
  message: string
  ociDllFound?: boolean
  clientVersion?: string | null
  architecture?: string
  libDir?: string
}

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
  const [clientValidation, setClientValidation] = useState<ClientValidationResult | null>(null)

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
    if (field === 'oracleClientLibDir') {
      setClientValidation(null)
    }
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

  const identityPayload = useCallback(
    () => ({
      username: form.username.trim(),
      tnsAlias: form.tnsAlias.trim(),
      oracleClientLibDir: form.oracleClientLibDir.trim(),
      tnsAdminPath: form.tnsAdminPath.trim(),
      tnsFileName: form.tnsFileName.trim() || 'tnsnames.ora',
    }),
    [form],
  )

  /** Valida o caminho do Oracle Client informado no navegador via API local. */
  const validateClientPath = useCallback(async (): Promise<ClientValidationResult> => {
    const libDir = form.oracleClientLibDir.trim()
    if (!libDir) {
      const result = {
        ok: false,
        message: 'Informe o caminho do Oracle Client (pasta onde está a OCI.DLL).',
      }
      setClientValidation(result)
      setError(result.message)
      return result
    }

    setBusy(true)
    setError(null)
    setProgress('Validando Oracle Client e OCI.DLL...')
    try {
      const result = await oracleApi.validateClient(libDir, form.tnsAdminPath.trim() || undefined)
      const mapped: ClientValidationResult = {
        ok: result.ok,
        message: result.message,
        ociDllFound: result.ociDllFound,
        clientVersion: result.clientVersion,
        architecture: (result as { architecture?: string }).architecture,
        libDir,
      }
      setClientValidation(mapped)
      if (!result.ok) setError(result.message)
      await oracleApi.saveConfiguration(toPayload())
      await refreshStatus()
      setProgress(null)
      return mapped
    } catch (err) {
      const mapped: ClientValidationResult = {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Falha ao validar Oracle Client. A API local precisa acessar o caminho informado.',
        libDir,
      }
      setClientValidation(mapped)
      setError(mapped.message)
      setProgress(null)
      return mapped
    } finally {
      setBusy(false)
    }
  }, [form.oracleClientLibDir, form.tnsAdminPath, refreshStatus, toPayload])

  const loadAliases = useCallback(async () => {
    if (!form.tnsAdminPath.trim()) {
      setError('Informe o TNS_ADMIN para listar os aliases do tnsnames.ora.')
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

  /** Logon: valida Client no caminho informado → conecta com TNS + usuário/senha. */
  const logon = useCallback(async (): Promise<boolean> => {
    if (!form.oracleClientLibDir.trim()) {
      setError('Informe o caminho do Oracle Client para validar a OCI.DLL.')
      return false
    }
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
    try {
      setProgress('1. Validando Oracle Client (OCI.DLL)...')
      const client = await oracleApi.validateClient(
        form.oracleClientLibDir.trim(),
        form.tnsAdminPath.trim() || undefined,
      )
      setClientValidation({
        ok: client.ok,
        message: client.message,
        ociDllFound: client.ociDllFound,
        clientVersion: client.clientVersion,
        libDir: form.oracleClientLibDir.trim(),
      })
      if (!client.ok) {
        setError(client.message)
        setProgress(null)
        return false
      }

      setProgress('2. Salvando apontamento e conectando...')
      await oracleApi.saveConfiguration(toPayload())
      const result = await oracleApi.connect(form.password || undefined, identityPayload())
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
  }, [
    form.oracleClientLibDir,
    form.password,
    form.tnsAdminPath,
    form.tnsAlias,
    form.username,
    identityPayload,
    refreshStatus,
    status?.passwordAvailableInMemory,
    toPayload,
  ])

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
    clientValidation,
    setShowPassword,
    setShowAdvanced,
    setError,
    updateField,
    refreshStatus,
    loadAliases,
    validateClientPath,
    logon,
    logoff,
    saveAdvanced,
    setSelectedAliasInfo,
  }
}
