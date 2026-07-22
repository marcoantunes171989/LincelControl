import { SearchX } from 'lucide-react'
import { ModuleItem } from './ModuleItem'
import type { ModuleDefinition, ModuleState } from '../types'

interface ModuleGridProps {
  modules: ModuleDefinition[]
  moduleState: ModuleState
  onToggle: (id: string) => void
}

export function ModuleGrid({ modules, moduleState, onToggle }: ModuleGridProps) {
  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 p-10 text-center">
        <SearchX size={28} className="text-slate-300" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500">Nenhum módulo encontrado para esta busca.</p>
        <p className="text-xs text-slate-400">Ajuste o termo pesquisado ou os filtros selecionados.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {modules.map((module) => (
        <ModuleItem key={module.id} module={module} selected={Boolean(moduleState[module.id])} onToggle={onToggle} />
      ))}
    </div>
  )
}
