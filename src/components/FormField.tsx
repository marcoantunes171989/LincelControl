import { Minus, Plus, X } from 'lucide-react'
import { DatabaseFieldBadge } from './DatabaseFieldBadge'

interface FormFieldProps {
  id: string
  label: string
  dbField: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  inputMode?: 'numeric' | 'text'
  maxLength?: number
  placeholder?: string
  required?: boolean
  clearable?: boolean
  stepper?: boolean
  min?: number
  max?: number
}

export function FormField({
  id,
  label,
  dbField,
  value,
  onChange,
  error,
  hint,
  inputMode = 'text',
  maxLength,
  placeholder,
  required,
  clearable = false,
  stepper = false,
  min,
  max,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  const handleStep = (delta: number) => {
    const current = Number.parseInt(value, 10)
    const base = Number.isNaN(current) ? 0 : current
    let next = base + delta
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(String(next))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="text-red-600" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
        <DatabaseFieldBadge field={dbField} />
      </div>

      <div className="relative flex items-stretch gap-1.5">
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`min-h-11 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
            clearable && value ? 'pr-9' : ''
          } ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
        />
        {clearable && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`Limpar ${label}`}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        {stepper && (
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              aria-label={`Diminuir ${label}`}
              className="flex min-h-11 w-10 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <Minus size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label={`Aumentar ${label}`}
              className="flex min-h-11 w-10 items-center justify-center border-l border-slate-300 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
