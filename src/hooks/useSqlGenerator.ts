import { useCallback, useMemo, useState } from 'react'
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
import { buildSqlFileName } from '../utils/downloadSql'
import { countActiveModules, countInactiveModules, generateUpdateSql } from '../utils/sqlGenerator'
import { hasValidationErrors, validateAll } from '../utils/validators'

export function useSqlGenerator() {
  const [store, setStore] = useState<StoreData>(EMPTY_STORE)
  const [license, setLicense] = useState<LicenseData>(EMPTY_LICENSE)
  const [modules, setModules] = useState<ModuleState>(EMPTY_MODULE_STATE)
  const [nfeExpertMode, setNfeExpertMode] = useState<NfeExpertMode>(EMPTY_NFE_EXPERT_MODE)

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
    () => generateUpdateSql({ store, license, modules, nfeExpertMode }),
    [store, license, modules, nfeExpertMode],
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
  }
}
