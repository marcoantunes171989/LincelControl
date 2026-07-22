interface DatabaseFieldBadgeProps {
  field: string
  className?: string
}

/** Identifica o nome físico do campo no banco (TAB_LOJA), sem competir visualmente com o rótulo principal. */
export function DatabaseFieldBadge({ field, className = '' }: DatabaseFieldBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-tight text-slate-500 ${className}`}
    >
      {field}
    </span>
  )
}
