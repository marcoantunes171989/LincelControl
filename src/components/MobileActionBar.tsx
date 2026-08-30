import { Copy, DatabaseZap, Download, Loader2 } from 'lucide-react'

interface MobileActionBarProps {
  disabled: boolean
  onCopy: () => void
  onDownload: () => void
  onApply: () => void
  applyDisabled: boolean
  applyBusy: boolean
}

export function MobileActionBar({
  disabled,
  onCopy,
  onDownload,
  onApply,
  applyDisabled,
  applyBusy,
}: MobileActionBarProps) {
  if (disabled) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      role="group"
      aria-label="Ações rápidas do script"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Copy size={16} aria-hidden="true" />
            Copiar SQL
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Download size={16} aria-hidden="true" />
            Baixar SQL
          </button>
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={applyDisabled}
          title="Atualizar diretamente no Oracle"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {applyBusy ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <DatabaseZap size={16} aria-hidden="true" />
          )}
          Aplicar no Oracle
        </button>
      </div>
    </div>
  )
}
