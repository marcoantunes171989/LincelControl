import { Check } from 'lucide-react'
import { DatabaseFieldBadge } from './DatabaseFieldBadge'
import type { ModuleDefinition } from '../types'

interface ModuleItemProps {
  module: ModuleDefinition
  selected: boolean
  onToggle: (id: string) => void
}

export function ModuleItem({ module, selected, onToggle }: ModuleItemProps) {
  const descriptionId = `module-${module.id}-desc`

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-describedby={descriptionId}
      onClick={() => onToggle(module.id)}
      className={`flex min-h-11 w-full flex-col gap-1.5 rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="break-words text-sm font-medium text-slate-900">{module.label}</span>
        <span
          className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            selected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}
          aria-hidden="true"
        >
          {selected ? 'S' : 'N'}
        </span>
      </div>

      <DatabaseFieldBadge field={module.field} className="w-fit" />

      <div id={descriptionId} className="mt-1 flex items-center justify-between gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
          Categoria: {module.category}
        </span>
        {selected && <Check size={16} className="shrink-0 text-blue-600" aria-hidden="true" />}
      </div>
    </button>
  )
}
