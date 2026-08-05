import { Copy, Download } from 'lucide-react'

interface MobileActionBarProps {
  disabled: boolean
  onCopy: () => void
  onDownload: () => void
}

export function MobileActionBar({ disabled, onCopy, onDownload }: MobileActionBarProps) {
  if (disabled) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      role="group"
      aria-label="Ações rápidas do script"
    >
      <div className="mx-auto flex max-w-lg gap-2">
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
    </div>
  )
}
