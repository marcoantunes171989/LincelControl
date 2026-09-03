import { useCallback, useEffect, useState } from 'react'
import { oracleApi } from '../api/oracleApi'
import {
  EMPTY_ORACLE_FORM,
  type OracleFormState,
  type OracleRuntimeStatus,
  type StageResult,
  type TnsAliasInfo,
} from '../types/oracle'
import { parseTnsNames } from '../utils/tnsParser'

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
  const [aliasDetails, setAliasDetails] = useState<TnsAliasInfo[]>([])
  const [tnsImported, setTnsImported] = useState(false)
  const [tnsFileLabel, setTnsFileLabel] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const next = await oracleApi.getStatus()
      setStatus(next)
      setStages(Array.isArray(next.stages) ? next.stages : [])
      // Stub da Vercel responde JSON, mas não executa Oracle de verdade.
      const isStub = next.hostMode === 'vercel-stub'
      setApiReachable(!isStub)
      if (isStub) {
        setError(next.lastError || 'API Oracle local necessária para validar Client e conectar.')
      } else {
        setError(null)
      }
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
        if (config.tnsAdminPath) {
          setTnsImported(true)
          setTnsFileLabel(config.tnsFileName || 'tnsnames.ora')
          try {
            const listed = await oracleApi.listAliases(
              config.tnsAdminPath,
              config.tnsFileName || 'tnsnames.ora',
            )
            setAliases(listed.aliases)
            if (config.tnsAlias) {
              const parsed = await oracleApi.parseAlias(
                config.tnsAdminPath,
                config.tnsFileName || 'tnsnames.ora',
                config.tnsAlias,
              )
              setSelectedAliasInfo(parsed.alias)
              setAliasDetails([parsed.alias])
            }
          } catch {
            /* TNS ainda não disponível no disco da API */
          }
        }
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
      oracleClientLibDir: '',
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
      tnsAdminPath: form.tnsAdminPath.trim(),
      tnsFileName: form.tnsFileName.trim() || 'tnsnames.ora',
      expectedHost: form.expectedHost.trim(),
      expectedPort: form.expectedPort ? Number.parseInt(form.expectedPort, 10) || null : null,
      expectedDatabase: form.expectedDatabase.trim(),
      privilege: form.privilege,
    }),
    [form],
  )

  const selectAlias = useCallback(
    (aliasName: string, details?: TnsAliasInfo[]) => {
      const source = details ?? aliasDetails
      const info = source.find((item) => item.alias.toUpperCase() === aliasName.trim().toUpperCase()) || null
      updateField('tnsAlias', info?.alias || aliasName.trim())
      setSelectedAliasInfo(info)
      if (info) {
        updateField('expectedHost', info.hosts[0] || '')
        updateField('expectedPort', info.ports[0] ? String(info.ports[0]) : '1521')
        updateField('expectedDatabase', info.serviceName || info.sid || '')
      }
    },
    [aliasDetails, updateField],
  )

  /** Importa tnsnames.ora pelo navegador; se a API falhar, parseia localmente. */
  const importTnsFile = useCallback(
    async (file: File): Promise<boolean> => {
      const TNS_MAX_BYTES = 256 * 1024
      const nameOk = /\.ora$/i.test(file.name) || /^tnsnames(\.ora)?$/i.test(file.name)
      if (!nameOk) {
        setError('Selecione um arquivo tnsnames.ora ou .ora.')
        return false
      }
      if (file.size > TNS_MAX_BYTES) {
        setError('Arquivo TNS excede o limite de 256 KB.')
        return false
      }

      setBusy(true)
      setError(null)
      setProgress('Lendo arquivo TNS...')
      try {
        const content = await file.text()
        const localAliases = parseTnsNames(content)
        if (localAliases.length === 0) {
          throw new Error('Nenhum alias TNS encontrado no arquivo. Verifique se é um tnsnames.ora válido.')
        }

        const applyLocal = (label: string) => {
          setAliasDetails(localAliases)
          setAliases(localAliases.map((item) => item.alias))
          setTnsFileLabel(label)
          const preferred =
            localAliases.find((item) => item.alias.toUpperCase() === form.tnsAlias.toUpperCase()) ||
            localAliases[0]
          selectAlias(preferred.alias, localAliases)
        }

        if (apiReachable === false) {
          setTnsImported(true)
          applyLocal(`${file.name} · ${localAliases.length} alias(es) (local)`)
          setError(
            'TNS lido no navegador. Para gravar na API e conectar ao banco, execute npm run dev:server e use http://localhost:5173.',
          )
          setProgress(null)
          return true
        }

        setProgress('Enviando TNS à API...')
        try {
          const result = await oracleApi.importTns(content, file.name || 'tnsnames.ora')
          setAliasDetails(result.aliases)
          setAliases(result.aliasNames)
          setTnsImported(true)
          setTnsFileLabel(file.name || 'tnsnames.ora')
          updateField('tnsAdminPath', result.tnsAdminPath)
          updateField('tnsFileName', result.tnsFileName)
          const preferred =
            result.aliases.find((item) => item.alias.toUpperCase() === form.tnsAlias.toUpperCase()) ||
            result.aliases[0]
          selectAlias(preferred.alias, result.aliases)
          setProgress(null)
          await refreshStatus()
          return true
        } catch (apiErr) {
          setTnsImported(true)
          applyLocal(`${file.name} · ${localAliases.length} alias(es) (local)`)
          setError(
            apiErr instanceof Error
              ? `${apiErr.message} O arquivo foi lido localmente; inicie a API local para conectar.`
              : 'TNS lido localmente. Inicie a API local para conectar.',
          )
          setProgress(null)
          return true
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao importar TNS')
        setProgress(null)
        return false
      } finally {
        setBusy(false)
      }
    },
    [apiReachable, form.tnsAlias, refreshStatus, selectAlias, updateField],
  )

  const loadAliases = useCallback(async () => {
    if (aliasDetails.length > 0) {
      setAliases(aliasDetails.map((item) => item.alias))
      return aliasDetails.map((item) => item.alias)
    }
    if (!form.tnsAdminPath.trim()) {
      setError('Importe o arquivo tnsnames.ora ou informe o TNS_ADMIN.')
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
  }, [aliasDetails, form.tnsAdminPath, form.tnsFileName])

  /** Logon Thin: TNS (HOST/PORT/SERVICE) + Username/Password — sem OCI.DLL. */
  const logon = useCallback(async (): Promise<boolean> => {
    if (!tnsImported && !form.expectedHost.trim()) {
      setError('Importe o arquivo tnsnames.ora e selecione o Database.')
      return false
    }
    if (!form.username.trim() || !form.tnsAlias.trim()) {
      setError('Informe Username e Database (alias TNS).')
      return false
    }
    if (!form.expectedHost.trim() || !form.expectedDatabase.trim()) {
      setError('Selecione um Database com HOST e SERVICE_NAME/SID no TNS importado.')
      return false
    }
    if (!form.password && !status?.passwordAvailableInMemory) {
      setError('Informe a Password.')
      return false
    }

    setBusy(true)
    setError(null)
    try {
      setProgress('Conectando ao Oracle (modo Thin, sem Instant Client)...')
      try {
        await oracleApi.saveConfiguration(toPayload())
      } catch {
        /* connect envia HOST/PORT/SERVICE mesmo se o save parcial falhar */
      }
      const result = await oracleApi.connect(form.password || undefined, identityPayload())
      setStatus(result.status)
      setStages(result.status.stages ?? [])
      setClientValidation({
        ok: true,
        message: 'Driver Thin — OCI.DLL não utilizada.',
        ociDllFound: false,
        clientVersion: result.status.clientVersion,
      })
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
    form.expectedDatabase,
    form.expectedHost,
    form.password,
    form.tnsAlias,
    form.username,
    identityPayload,
    refreshStatus,
    status?.passwordAvailableInMemory,
    tnsImported,
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

  /** Salva TNS_ADMIN na API, valida pasta/arquivo e carrega aliases. */
  const saveAdvanced = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const adminPath = form.tnsAdminPath.trim()
    const fileName = form.tnsFileName.trim() || 'tnsnames.ora'

    if (!adminPath) {
      const message = 'Informe o caminho TNS_ADMIN (pasta onde está o tnsnames.ora).'
      setError(message)
      setShowAdvanced(true)
      return { ok: false, message }
    }

    setBusy(true)
    setError(null)
    setProgress('Salvando e validando TNS_ADMIN...')
    try {
      const result = await oracleApi.saveTnsAdmin(adminPath, fileName)
      updateField('tnsAdminPath', result.tnsAdminPath)
      updateField('tnsFileName', result.tnsFileName)
      setAliases(result.aliases)
      setAliasDetails(result.aliasDetails)
      setTnsImported(true)
      setTnsFileLabel(`${result.tnsFileName} · ${result.aliases.length} alias(es)`)

      const preferred =
        result.aliasDetails.find((item) => item.alias.toUpperCase() === form.tnsAlias.toUpperCase()) ||
        result.aliasDetails[0]
      if (preferred) {
        selectAlias(preferred.alias, result.aliasDetails)
      }

      setStatus(result.status)
      setStages(Array.isArray(result.status.stages) ? result.status.stages : [])
      setProgress(null)
      return { ok: true, message: result.message }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar TNS_ADMIN'
      setError(message)
      setProgress(null)
      return { ok: false, message }
    } finally {
      setBusy(false)
    }
  }, [form.tnsAdminPath, form.tnsAlias, form.tnsFileName, selectAlias, updateField])

  return {
    form,
    status,
    aliases,
    aliasDetails,
    selectedAliasInfo,
    stages,
    progress,
    busy,
    error,
    showPassword,
    showAdvanced,
    apiReachable,
    clientValidation,
    tnsImported,
    tnsFileLabel,
    setShowPassword,
    setShowAdvanced,
    setError,
    updateField,
    selectAlias,
    refreshStatus,
    loadAliases,
    importTnsFile,
    logon,
    logoff,
    saveAdvanced,
    setSelectedAliasInfo,
  }
}
