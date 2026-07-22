import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface PrivacyBadgeProps {
  icon: LucideIcon
  children: ReactNode
}

export function PrivacyBadge({ icon: Icon, children }: PrivacyBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      <Icon size={13} className="shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}
