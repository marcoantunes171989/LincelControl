import { CheckSquare, Search, Square } from 'lucide-react'

interface ModuleToolbarProps {
  totalFields: number
  selectedCount: number
  activeCount: number
  inactiveCount: number
  query: string
  onQueryChange: (value: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export function ModuleToolbar({
  totalFields,
  selectedCount,
  activeCount,
  inactiveCount,
  query,
  onQueryChange,
  onSelectAll,
  onDeselectAll,
}: ModuleToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Campos</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">{totalFields}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Selecionados</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">{selectedCount}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Ativos (S)</p>
          <p className="text-lg font-semibold tabular-nums text-blue-700">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Inativos (N)</p>
          <p className="text-lg font-semibold tabular-nums text-slate-600">{inactiveCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSelectAll}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:flex-none"
        >
          <CheckSquare size={16} aria-hidden="true" />
          Selecionar todos
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:flex-none"
        >
          <Square size={16} aria-hidden="true" />
          Limpar seleção
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filtrar por módulo ou campo do banco..."
          aria-label="Filtrar módulos"
          className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  )
}
