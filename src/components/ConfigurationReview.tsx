import { AlertTriangle, ClipboardList } from 'lucide-react'
import type { LicenseData, StoreData } from '../types'
import { formatCnpjMask, normalizeCnpj } from '../utils/formatters'

interface ConfigurationReviewProps {
  store: StoreData
  license: LicenseData
  activeModulesCount: number
  integrationsActiveCount: number
  activeModuleLabels: string[]
  pendingIssuesCount: number
}

const SUMMARY_PREVIEW_LIMIT = 6

function parseIntSafe(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function ConfigurationReview({
  store,
  license,
  activeModulesCount,
  integrationsActiveCount,
  activeModuleLabels,
  pendingIssuesCount,
}: ConfigurationReviewProps) {
  const totalPdvs =
    parseIntSafe(license.numPdv) +
    parseIntSafe(license.numPdvBalcao) +
    parseIntSafe(license.numPdvReserva) +
    parseIntSafe(license.numPdvRecebto)

  const previewLabels = activeModuleLabels.slice(0, SUMMARY_PREVIEW_LIMIT)
  const remainingCount = activeModuleLabels.length - previewLabels.length

  return (
    <section
      id="revisao"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="review-heading"
    >
      <h2 id="review-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <ClipboardList size={18} className="text-blue-600" aria-hidden="true" />
        Resumo da configuração
      </h2>
      <p className="mt-1 text-sm text-slate-500">Confira os dados antes de copiar ou baixar o script.</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Loja</dt>
          <dd className="truncate text-sm font-semibold text-slate-900">{store.descricao || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Código</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">{store.codLoja || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">CNPJ</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">
            {store.numCgc ? formatCnpjMask(normalizeCnpj(store.numCgc)) : '—'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Licença</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">{license.numLicenca || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total de PDVs</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">{totalPdvs}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Módulos ativos</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">{activeModulesCount}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Integrações ativas</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">{integrationsActiveCount}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Alertas pendentes</dt>
          <dd
            className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
              pendingIssuesCount > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {pendingIssuesCount > 0 && <AlertTriangle size={14} aria-hidden="true" />}
            {pendingIssuesCount}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Principais módulos selecionados</p>
        {previewLabels.length === 0 ? (
          <p className="mt-1.5 text-sm text-slate-500">Nenhum módulo selecionado.</p>
        ) : (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {previewLabels.map((label) => (
              <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {label}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                +{remainingCount} outros
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
