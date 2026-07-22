import { Copy, Download, RotateCcw, Trash2 } from 'lucide-react'

interface ActionBarProps {
  disabled: boolean
  onCopy: () => void
  onRequestDownload: () => void
  onRestoreExample: () => void
  onRequestClear: () => void
}

export function ActionBar({ disabled, onCopy, onRequestDownload, onRestoreExample, onRequestClear }: ActionBarProps) {
  return (
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
  )
}
