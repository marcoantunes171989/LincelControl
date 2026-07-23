import { LayoutGrid } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActionBar } from './components/ActionBar'
import { ConfigurationReview } from './components/ConfigurationReview'
import { ConfirmationModal } from './components/ConfirmationModal'
import { LicensePdvCard } from './components/LicensePdvCard'
import { ModuleFilter } from './components/ModuleFilter'
import { ModuleGrid } from './components/ModuleGrid'
import { ModuleToolbar } from './components/ModuleToolbar'
import { NfeExpertSelector } from './components/NfeExpertSelector'
import { PageHeader } from './components/PageHeader'
import { ProgressNavigation } from './components/ProgressNavigation'
import { SqlPreview } from './components/SqlPreview'
import { StoreInformationCard } from './components/StoreInformationCard'
import { Toast } from './components/Toast'
import { MODULES } from './data/modules'
import { useSqlGenerator } from './hooks/useSqlGenerator'
import type { FormStatus, ModuleStatusFilter } from './types'
import { copyToClipboard } from './utils/clipboard'
import { downloadSqlFile } from './utils/downloadSql'
import { countActiveByCategory, getActiveModuleLabels } from './utils/sqlGenerator'
import { ValidationSummary } from './components/ValidationSummary'

type ModalKind = 'download' | 'clear' | null

const SELECTABLE_MODULES = MODULES.filter((module) => !module.exclusiveGroup)

function App() {
  const {
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
    totalModulesCount,
    fileName,
  } = useSqlGenerator()

  const [activeModal, setActiveModal] = useState<ModalKind>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [moduleQuery, setModuleQuery] = useState('')
  const [moduleStatusFilter, setModuleStatusFilter] = useState<ModuleStatusFilter>('all')
  const [moduleCategory, setModuleCategory] = useState('all')

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const handleCopy = useCallback(async () => {
    if (!isValid) return
    const success = await copyToClipboard(sql)
    setToastMessage(success ? 'Script SQL copiado com sucesso.' : 'Não foi possível copiar o script.')
  }, [isValid, sql])

  const handleConfirmDownload = useCallback(() => {
    downloadSqlFile(sql, fileName)
    setActiveModal(null)
    setToastMessage('Arquivo SQL baixado com sucesso.')
  }, [sql, fileName])

  const handleConfirmClear = useCallback(() => {
    clearForm()
    setActiveModal(null)
  }, [clearForm])

  const selectedModulesCount = useMemo(() => Object.values(modules).filter(Boolean).length, [modules])

  const filteredModules = useMemo(() => {
    const normalizedQuery = moduleQuery.trim().toLowerCase()
    return SELECTABLE_MODULES.filter((module) => {
      if (moduleCategory !== 'all' && module.category !== moduleCategory) return false
      const isSelected = Boolean(modules[module.id])
      if (moduleStatusFilter === 'selected' && !isSelected) return false
      if (moduleStatusFilter === 'unselected' && isSelected) return false
      if (normalizedQuery === '') return true
      const haystack = `${module.label} ${module.field} ${module.comment} ${module.category}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [moduleQuery, moduleCategory, moduleStatusFilter, modules])

  const integrationsActiveCount = useMemo(
    () => countActiveByCategory(modules, nfeExpertMode, 'Integração'),
    [modules, nfeExpertMode],
  )
  const activeModuleLabels = useMemo(() => getActiveModuleLabels(modules, nfeExpertMode), [modules, nfeExpertMode])
  const pendingIssuesCount = useMemo(() => Object.values(errors).filter(Boolean).length, [errors])

  const formStatus: FormStatus = useMemo(() => {
    const requiredFilled =
      store.codLoja !== '' &&
      store.numCgc !== '' &&
      license.numLicenca !== '' &&
      license.numDiaVencto !== '' &&
      license.numPdv !== '' &&
      license.numPdvBalcao !== '' &&
      license.numPdvReserva !== '' &&
      license.numPdvRecebto !== ''
    if (!requiredFilled) return 'incomplete'
    if (!isValid) return 'needs-validation'
    return 'valid'
  }, [store, license, isValid])

  const completedSteps = useMemo(() => {
    const set = new Set<string>()
    if (!errors.codLoja && !errors.numCgc && store.codLoja !== '' && store.numCgc !== '') set.add('loja')
    const licenseFilled =
      license.numLicenca !== '' &&
      license.numDiaVencto !== '' &&
      license.numPdv !== '' &&
      license.numPdvBalcao !== '' &&
      license.numPdvReserva !== '' &&
      license.numPdvRecebto !== ''
    const licenseValid =
      !errors.numLicenca &&
      !errors.numDiaVencto &&
      !errors.numPdv &&
      !errors.numPdvBalcao &&
      !errors.numPdvReserva &&
      !errors.numPdvRecebto
    if (licenseFilled && licenseValid) set.add('licenca')
    set.add('modulos')
    if (isValid) set.add('revisao')
    return set
  }, [errors, store, license, isValid])

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        status={formStatus}
        onClear={() => setActiveModal('clear')}
        onCopy={handleCopy}
        onDownload={() => setActiveModal('download')}
        copyDisabled={!isValid}
        downloadDisabled={!isValid}
      />
      <ProgressNavigation completedSteps={completedSteps} />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <ValidationSummary errors={errors} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start">
          <div className="flex flex-col gap-6">
            <StoreInformationCard store={store} errors={errors} onChange={updateStoreField} />
            <LicensePdvCard license={license} errors={errors} onChange={updateLicenseField} />

            <section
              id="modulos"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              aria-labelledby="modules-heading"
            >
              <div className="mb-1">
                <h2 id="modules-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <LayoutGrid size={18} className="text-blue-600" aria-hidden="true" />
                  Módulos e integrações
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cada módulo sempre entra no script como <code className="font-mono">'S'</code> (ativo) ou{' '}
                  <code className="font-mono">'N'</code> (inativo).
                </p>
              </div>

              <div className="mt-4">
                <NfeExpertSelector value={nfeExpertMode} onChange={setNfeExpertMode} />
              </div>

              <div className="mt-4">
                <ModuleToolbar
                  totalFields={totalModulesCount}
                  selectedCount={selectedModulesCount}
                  activeCount={activeModulesCount}
                  inactiveCount={inactiveModulesCount}
                  query={moduleQuery}
                  onQueryChange={setModuleQuery}
                  onSelectAll={selectAllModules}
                  onDeselectAll={deselectAllModules}
                />
              </div>

              <div className="mt-4">
                <ModuleFilter
                  status={moduleStatusFilter}
                  onStatusChange={setModuleStatusFilter}
                  category={moduleCategory}
                  onCategoryChange={setModuleCategory}
                  resultCount={filteredModules.length}
                />
              </div>

              <div className="mt-3">
                <ModuleGrid modules={filteredModules} moduleState={modules} onToggle={toggleModule} />
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <ConfigurationReview
              store={store}
              license={license}
              activeModulesCount={activeModulesCount}
              integrationsActiveCount={integrationsActiveCount}
              activeModuleLabels={activeModuleLabels}
              pendingIssuesCount={pendingIssuesCount}
            />
            <SqlPreview
              sql={sql}
              isValid={isValid}
              totalModules={totalModulesCount}
              activeModules={activeModulesCount}
              inactiveModules={inactiveModulesCount}
              fileName={fileName}
              onCopy={handleCopy}
            />
            <ActionBar
              disabled={!isValid}
              onCopy={handleCopy}
              onRequestDownload={() => setActiveModal('download')}
              onRestoreExample={restoreExample}
              onRequestClear={() => setActiveModal('clear')}
            />
          </div>
        </div>
      </main>

      <ConfirmationModal
        open={activeModal === 'download'}
        title={`Confirma a geração do UPDATE da loja ${store.codLoja || '—'}?`}
        description="O arquivo .sql será baixado para o seu computador. Revise os dados antes de executar no banco."
        confirmLabel="Baixar script"
        onConfirm={handleConfirmDownload}
        onCancel={() => setActiveModal(null)}
      />

      <ConfirmationModal
        open={activeModal === 'clear'}
        title="Limpar formulário?"
        description="Todos os dados preenchidos serão perdidos e os módulos serão desmarcados."
        confirmLabel="Limpar"
        tone="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setActiveModal(null)}
      />

      <Toast message={toastMessage} />
    </div>
  )
}

export default App
