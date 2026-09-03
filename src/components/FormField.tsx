import { Loader2, X } from 'lucide-react'
import { FieldHeader } from './FieldHeader'
import { NumberStepper } from './NumberStepper'

interface FormFieldProps {
  id: string
  label: string
  dbField: string
  value: string
  onChange?: (value: string) => void
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
  readOnly?: boolean
  loading?: boolean
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
  readOnly = false,
  loading = false,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <FieldHeader htmlFor={id} label={label} fieldCode={dbField} required={required} />

      <div className="relative flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
        <input
          id={id}
          value={loading ? 'Consultando...' : value}
          onChange={(event) => onChange?.(event.target.value)}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          readOnly={readOnly || loading}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-busy={loading}
          className={`min-h-11 lg:min-h-9 w-full min-w-0 rounded-lg border px-3 py-2 text-sm outline-none transition ${
            readOnly
              ? 'cursor-default border-slate-200 bg-slate-50 text-slate-600'
              : 'text-slate-900 focus:ring-2 focus:ring-blue-200'
          } ${loading ? 'italic text-slate-400' : ''} ${clearable && value ? 'pr-9' : ''} ${
            error ? 'border-red-400 focus:border-red-500' : !readOnly ? 'border-slate-300 focus:border-blue-500' : ''
          }`}
        />
        {loading && (
          <Loader2
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
            aria-hidden="true"
          />
        )}
        {clearable && value && !readOnly && (
          <button
            type="button"
            onClick={() => onChange?.('')}
            aria-label={`Limpar ${label}`}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        {stepper && (
          <NumberStepper
            value={value}
            onChange={(next) => onChange?.(next)}
            label={label}
            min={min}
            max={max}
            disabled={readOnly || loading}
          />
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {/* Reserva a altura da linha de erro mesmo sem erro — evita que campos
          lado a lado no mesmo grid (ex.: Licença e PDVs) fiquem desalinhados
          só porque um vizinho está mostrando validação e o outro não. */}
      {!readOnly && (
        <p
          id={errorId}
          role="alert"
          aria-hidden={error ? undefined : true}
          className={`min-h-4 text-xs font-medium text-red-600 ${error ? '' : 'invisible'}`}
        >
          {error || ' '}
        </p>
      )}
    </div>
  )
}
