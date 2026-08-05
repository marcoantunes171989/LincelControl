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

  const refreshStatus = useCallback(async () => {
    try {
      const next = await oracleApi.getStatus()
      setStatus(next)
      setStages(next.stages ?? [])
      setApiReachable(true)
      return next
    } catch {
      setApiReachable(false)
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
      await refreshStatus()
      setApiReachable(true)
    } catch {
      setApiReachable(false)
    }
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
      expectedPort: Number.parseInt(form.expectedPort, 10) || 1521,
      expectedDatabase: form.expectedDatabase.trim(),
      username: form.username.trim(),
    }),
    [form],
  )

  const saveConfiguration = useCallback(async () => {
    setBusy(true)
    setError(null)
    setProgress('Salvando configuração...')
    try {
      await oracleApi.saveConfiguration(toPayload())
      await refreshStatus()
      setProgress(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar configuração')
      setProgress(null)
      return false
    } finally {
      setBusy(false)
    }
  }, [refreshStatus, toPayload])

  const validateClient = useCallback(async () => {
    setBusy(true)
    setError(null)
    setProgress('1. Validando Oracle Client...')
    try {
      const result = await oracleApi.validateClient(form.oracleClientLibDir, form.tnsAdminPath || undefined)
      await refreshStatus()
      if (!result.ok) throw new Error(result.message)
      setProgress(null)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao validar Oracle Client')
      setProgress(null)
      throw err
    } finally {
      setBusy(false)
    }
  }, [form.oracleClientLibDir, form.tnsAdminPath, refreshStatus])

  const loadAliases = useCallback(async () => {
    setBusy(true)
    setError(null)
    setProgress('2. Localizando tnsnames.ora...')
    try {
      const result = await oracleApi.listAliases(form.tnsAdminPath, form.tnsFileName || 'tnsnames.ora')
      setAliases(result.aliases)
      setProgress(null)
      return result.aliases
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ler aliases TNS')
      setProgress(null)
      throw err
    } finally {
      setBusy(false)
    }
  }, [form.tnsAdminPath, form.tnsFileName])

  const selectAlias = useCallback(
    async (alias: string) => {
      updateField('tnsAlias', alias)
      setBusy(true)
      setError(null)
      setProgress('3. Analisando alias...')
      try {
        const result = await oracleApi.parseAlias(form.tnsAdminPath, form.tnsFileName || 'tnsnames.ora', alias)
        setSelectedAliasInfo(result.alias)
        updateField('expectedHost', result.alias.hosts[0] || '')
        updateField('expectedPort', result.alias.ports[0] ? String(result.alias.ports[0]) : '1521')
        updateField('expectedDatabase', result.alias.serviceName || result.alias.sid || '')
        setProgress(null)
        return result.alias
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao analisar alias')
        setProgress(null)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [form.tnsAdminPath, form.tnsFileName, updateField],
  )

  const runValidation = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      setProgress('Salvando configuração...')
      await oracleApi.saveConfiguration(toPayload())

      setProgress('1. Validando Oracle Client...')
      setProgress('2. Localizando tnsnames.ora...')
      setProgress('3. Analisando alias...')
      setProgress('4. Validando IP e porta...')
      setProgress('5. Testando comunicação...')
      setProgress('6. Validando credenciais...')
      setProgress('7. Executando consulta...')

      const result = await oracleApi.validate(form.password || undefined)
      setStages(result.stages)
      setStatus(result.status)
      setSelectedAliasInfo(result.alias)
      setProgress(null)
      if (!result.ok) {
        const failed = [...result.stages].reverse().find((stage) => !stage.ok && stage.status === 'error')
        throw new Error(failed?.message || result.message || 'Validação falhou')
      }
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na validação')
      setProgress(null)
      await refreshStatus()
      throw err
    } finally {
      setBusy(false)
    }
  }, [form.password, refreshStatus, toPayload])

  const toggleConnection = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      setBusy(true)
      setError(null)
      try {
        await oracleApi.saveConfiguration(toPayload())
        if (enabled) {
          setProgress('Conectando ao Oracle...')
          if (!form.password && !status?.passwordAvailableInMemory) {
            setError('Informe a senha Oracle para conectar.')
            setProgress(null)
            return false
          }
          const result = await oracleApi.toggle(true, form.password || undefined)
          setStatus(result.status)
          setStages(result.status.stages ?? [])
        } else {
          setProgress('Desconectando...')
          const result = await oracleApi.toggle(false)
          setStatus(result.status)
          setStages(result.status.stages ?? [])
        }
        setProgress(null)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao alternar conexão')
        setProgress(null)
        await refreshStatus()
        return false
      } finally {
        setBusy(false)
      }
    },
    [form.password, refreshStatus, status?.passwordAvailableInMemory, toPayload],
  )

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
    apiReachable,
    setShowPassword,
    setError,
    updateField,
    refreshStatus,
    saveConfiguration,
    validateClient,
    loadAliases,
    selectAlias,
    runValidation,
    toggleConnection,
  }
}
