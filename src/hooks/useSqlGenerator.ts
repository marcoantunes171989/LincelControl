import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MODULES_TOTAL } from '../data/modules'
import {
  EMPTY_LICENSE,
  EMPTY_MODULE_STATE,
  EMPTY_NFE_EXPERT_MODE,
  EMPTY_STORE,
  EXAMPLE_LICENSE,
  EXAMPLE_MODULE_STATE,
  EXAMPLE_NFE_EXPERT_MODE,
  EXAMPLE_STORE,
  buildModuleState,
} from '../data/initialValues'
import type { LicenseData, ModuleState, NfeExpertMode, StoreData } from '../types'
import { lookupInscricaoEstadual } from '../utils/cnpjLookup'
import { buildSqlFileName } from '../utils/downloadSql'
import { normalizeCnpj } from '../utils/formatters'
import { countActiveModules, countInactiveModules, generateUpdateSql } from '../utils/sqlGenerator'
import { hasValidationErrors, validateAll } from '../utils/validators'

const INSCRICAO_ESTADUAL_NOT_FOUND = 'ISENTO'

export function useSqlGenerator() {
  const [store, setStore] = useState<StoreData>(EMPTY_STORE)
  const [license, setLicense] = useState<LicenseData>(EMPTY_LICENSE)
  const [modules, setModules] = useState<ModuleState>(EMPTY_MODULE_STATE)
  const [nfeExpertMode, setNfeExpertMode] = useState<NfeExpertMode>(EMPTY_NFE_EXPERT_MODE)

  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [isLoadingInscricaoEstadual, setIsLoadingInscricaoEstadual] = useState(false)
  const lastCheckedCnpjRef = useRef('')

  useEffect(() => {
    const digits = normalizeCnpj(store.numCgc)

    if (digits.length !== 14) {
      lastCheckedCnpjRef.current = ''
      setIsLoadingInscricaoEstadual(false)
      setInscricaoEstadual('')
      return
    }

    if (digits === lastCheckedCnpjRef.current) return
    lastCheckedCnpjRef.current = digits

    const controller = new AbortController()
    setIsLoadingInscricaoEstadual(true)
    setInscricaoEstadual('')

    lookupInscricaoEstadual(digits, controller.signal)
      .then((result) => {
        setInscricaoEstadual(result.inscricaoEstadual || INSCRICAO_ESTADUAL_NOT_FOUND)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setInscricaoEstadual(INSCRICAO_ESTADUAL_NOT_FOUND)
      })
      .finally(() => {
        if (controller.signal.aborted) return
        setIsLoadingInscricaoEstadual(false)
      })

    return () => controller.abort()
  }, [store.numCgc])

  const updateStoreField = useCallback(<K extends keyof StoreData>(field: K, value: StoreData[K]) => {
    setStore((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateLicenseField = useCallback(<K extends keyof LicenseData>(field: K, value: LicenseData[K]) => {
    setLicense((prev) => ({ ...prev, [field]: value }))
  }, [])

  const toggleModule = useCallback((id: string) => {
    setModules((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const selectAllModules = useCallback(() => {
    setModules(buildModuleState(() => true))
    setNfeExpertMode('embedded')
  }, [])

  const deselectAllModules = useCallback(() => {
    setModules(buildModuleState(() => false))
    setNfeExpertMode('nenhuma')
  }, [])

  const restoreExample = useCallback(() => {
    setStore(EXAMPLE_STORE)
    setLicense(EXAMPLE_LICENSE)
    setModules(EXAMPLE_MODULE_STATE)
    setNfeExpertMode(EXAMPLE_NFE_EXPERT_MODE)
  }, [])

  const clearForm = useCallback(() => {
    setStore(EMPTY_STORE)
    setLicense(EMPTY_LICENSE)
    setModules(EMPTY_MODULE_STATE)
    setNfeExpertMode(EMPTY_NFE_EXPERT_MODE)
  }, [])

  const errors = useMemo(() => validateAll(store, license), [store, license])
  const isValid = useMemo(() => !hasValidationErrors(errors), [errors])

  const sql = useMemo(
    () => generateUpdateSql({ store, license, modules, nfeExpertMode, inscricaoEstadual }),
    [store, license, modules, nfeExpertMode, inscricaoEstadual],
  )

  const activeModulesCount = useMemo(() => countActiveModules(modules, nfeExpertMode), [modules, nfeExpertMode])
  const inactiveModulesCount = useMemo(
    () => countInactiveModules(modules, nfeExpertMode),
    [modules, nfeExpertMode],
  )

  const fileName = useMemo(() => buildSqlFileName(store), [store])

  return {
    store,
    license,
    modules,
    nfeExpertMode,
    updateStoreField,
    updateLicenseField,
    toggleModule,
    setNfeExpertMode,
    selectAllModules,
    deselectAllModules,
    restoreExample,
    clearForm,
    errors,
    isValid,
    sql,
    activeModulesCount,
    inactiveModulesCount,
    totalModulesCount: MODULES_TOTAL,
    fileName,
    inscricaoEstadual,
    isLoadingInscricaoEstadual,
  }
}
