import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

interface StatusBadgeProps {
  variant: StatusVariant
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

/** Pílula de status genérica — nunca depende só de cor: sempre acompanhada de ícone e texto. */
export function StatusBadge({ variant, icon: Icon, children, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${VARIANT_STYLES[variant]} ${className}`}
    >
      {Icon && <Icon size={13} className="shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}
