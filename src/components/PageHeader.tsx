import { AlertTriangle, CheckCircle2, Circle, Code2, Copy, Database, Download, ShieldCheck, Trash2 } from 'lucide-react'
import { PrivacyBadge } from './PrivacyBadge'
import { StatusBadge } from './StatusBadge'
import type { FormStatus } from '../types'

interface PageHeaderProps {
  status: FormStatus
  onClear: () => void
  onCopy: () => void
  onDownload: () => void
  copyDisabled: boolean
  downloadDisabled: boolean
}

const STATUS_CONFIG: Record<FormStatus, { label: string; variant: 'neutral' | 'warning' | 'success'; icon: typeof Circle }> = {
  incomplete: { label: 'Configuração incompleta', variant: 'neutral', icon: Circle },
  'needs-validation': { label: 'Validação necessária', variant: 'warning', icon: AlertTriangle },
  valid: { label: 'Script válido', variant: 'success', icon: CheckCircle2 },
}

export function PageHeader({ status, onClear, onCopy, onDownload, copyDisabled, downloadDisabled }: PageHeaderProps) {
  const config = STATUS_CONFIG[status]

  return (
    <header className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-200">
              <Database size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl lg:text-[1.75rem]">
                Gerador de Update — TAB_LOJA
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
                Configure a loja, selecione os módulos da licença e gere o script SQL automaticamente.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
                <PrivacyBadge icon={Code2}>100% front-end</PrivacyBadge>
                <PrivacyBadge icon={ShieldCheck}>Nenhuma informação é salva</PrivacyBadge>
                <StatusBadge variant={config.variant} icon={config.icon}>
                  {config.label}
                </StatusBadge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0" role="group" aria-label="Ações rápidas">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:flex-none"
            >
              <Trash2 size={16} aria-hidden="true" />
              Limpar
            </button>
            <button
              type="button"
              onClick={onCopy}
              disabled={copyDisabled}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <Copy size={16} aria-hidden="true" />
              Copiar
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={downloadDisabled}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:flex-none"
            >
              <Download size={16} aria-hidden="true" />
              Baixar SQL
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
