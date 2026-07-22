import { MODULE_CATEGORIES } from '../data/modules'
import type { ModuleStatusFilter } from '../types'

interface ModuleFilterProps {
  status: ModuleStatusFilter
  onStatusChange: (status: ModuleStatusFilter) => void
  category: string
  onCategoryChange: (category: string) => void
  resultCount: number
}

const STATUS_OPTIONS: { value: ModuleStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'selected', label: 'Selecionados' },
  { value: 'unselected', label: 'Não selecionados' },
]

export function ModuleFilter({ status, onStatusChange, category, onCategoryChange, resultCount }: ModuleFilterProps) {
  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Filtrar por estado de seleção"
        className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
      >
        {STATUS_OPTIONS.map((option) => {
          const isActive = option.value === status
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              aria-pressed={isActive}
              className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition ${
                isActive ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`min-h-9 rounded-full border px-3 text-xs font-medium transition ${
            category === 'all'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todas categorias
        </button>
        {MODULE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`min-h-9 rounded-full border px-3 text-xs font-medium transition ${
              category === cat
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500" aria-live="polite">
        {resultCount} {resultCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}
      </p>
    </div>
  )
}
