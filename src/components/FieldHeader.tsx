import { DatabaseFieldBadge } from './DatabaseFieldBadge'

interface FieldHeaderProps {
  htmlFor: string
  label: string
  fieldCode: string
  required?: boolean
}

/** Cabeçalho padrão de campo: rótulo prioritário + badge do nome físico da coluna, que quebra linha em telas estreitas sem empurrar outros campos do grid. */
export function FieldHeader({ htmlFor, label, fieldCode, required }: FieldHeaderProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <DatabaseFieldBadge field={fieldCode} />
    </div>
  )
}
