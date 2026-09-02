import { AlertTriangle, CheckCircle2, Circle, Database } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { FormStatus } from '../types'

interface MobileTopBarProps {
  title: string
  status?: FormStatus
}

const STATUS_CONFIG: Record<FormStatus, { label: string; variant: 'neutral' | 'warning' | 'success'; icon: typeof Circle }> = {
  incomplete: { label: 'Incompleto', variant: 'neutral', icon: Circle },
  'needs-validation': { label: 'Validar', variant: 'warning', icon: AlertTriangle },
  valid: { label: 'Válido', variant: 'success', icon: CheckCircle2 },
}

/**
 * Barra de topo compacta, estilo app nativo (< lg): substitui o header
 * editorial de desktop (título grande, descrição, selos). A navegação entre
 * seções fica na MobileTabBar; aqui só marca + contexto + status.
 */
export function MobileTopBar({ title, status }: MobileTopBarProps) {
  const config = status ? STATUS_CONFIG[status] : null

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-200">
            <Database size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-slate-900">LicenControl</p>
            <p className="truncate text-[11px] leading-tight text-slate-500">{title}</p>
          </div>
        </div>
        {config && (
          <StatusBadge variant={config.variant} icon={config.icon} className="shrink-0">
            {config.label}
          </StatusBadge>
        )}
      </div>
    </header>
  )
}
