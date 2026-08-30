import { Copy, DatabaseZap, Download, Loader2, RotateCcw, Settings2, Trash2 } from 'lucide-react'

interface ActionBarProps {
  disabled: boolean
  onCopy: () => void
  onRequestDownload: () => void
  onRestoreExample: () => void
  onRequestClear: () => void
  onApply: () => void
  applyDisabled: boolean
  applyBusy: boolean
  oracleConnected: boolean
  onConfigureOracle: () => void
}

export function ActionBar({
  disabled,
  onCopy,
  onRequestDownload,
  onRestoreExample,
  onRequestClear,
  onApply,
  applyDisabled,
  applyBusy,
  oracleConnected,
  onConfigureOracle,
}: ActionBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCopy}
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          <Copy size={16} aria-hidden="true" />
          Copiar SQL
        </button>
        <button
          type="button"
          onClick={onRequestDownload}
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          <Download size={16} aria-hidden="true" />
          Baixar arquivo .sql
        </button>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
        <button
          type="button"
          onClick={onApply}
          disabled={applyDisabled}
          title="Atualizar diretamente no Oracle"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {applyBusy ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <DatabaseZap size={16} aria-hidden="true" />
          )}
          Aplicar
        </button>
        <p className="mt-1.5 text-center text-[11px] text-emerald-800">Atualizar diretamente no Oracle</p>
        {!oracleConnected && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-amber-800">
            <span>Conecte ao Oracle antes de aplicar.</span>
            <button
              type="button"
              onClick={onConfigureOracle}
              className="inline-flex items-center gap-1 font-semibold text-blue-700 underline-offset-2 hover:underline"
            >
              <Settings2 size={12} aria-hidden="true" />
              Configurar Oracle
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onRestoreExample}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Restaurar exemplo
        </button>
        <button
          type="button"
          onClick={onRequestClear}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={16} aria-hidden="true" />
          Limpar formulário
        </button>
      </div>
    </div>
  )
}
