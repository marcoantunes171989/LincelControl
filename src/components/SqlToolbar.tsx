import { Copy } from 'lucide-react'

interface SqlToolbarProps {
  fileName: string
  onCopy: () => void
  copyDisabled: boolean
}

export function SqlToolbar({ fileName, onCopy, copyDisabled }: SqlToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/70 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <span className="truncate font-mono text-xs text-slate-400">{fileName}</span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        disabled={copyDisabled}
        aria-label="Copiar script SQL"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Copy size={12} aria-hidden="true" />
        Copiar
      </button>
    </div>
  )
}
