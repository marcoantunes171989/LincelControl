import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  value: string
  onChange: (value: string) => void
  label: string
  min?: number
  max?: number
  disabled?: boolean
}

/** Par de botões -/+ para campos numéricos; reutilizado por FormField sempre que `stepper` está ativo. */
export function NumberStepper({ value, onChange, label, min, max, disabled = false }: NumberStepperProps) {
  const step = (delta: number) => {
    const current = Number.parseInt(value, 10)
    const base = Number.isNaN(current) ? 0 : current
    let next = base + delta
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(String(next))
  }

  const atMin = min !== undefined && Number.parseInt(value, 10) <= min
  const atMax = max !== undefined && Number.parseInt(value, 10) >= max

  return (
    <div className="flex shrink-0 self-stretch overflow-hidden rounded-lg border border-slate-300 sm:self-auto">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || atMin}
        aria-label={`Diminuir ${label}`}
        className="flex min-h-11 lg:min-h-9 flex-1 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent sm:w-10 sm:flex-none"
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || atMax}
        aria-label={`Aumentar ${label}`}
        className="flex min-h-11 lg:min-h-9 flex-1 items-center justify-center border-l border-slate-300 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent sm:w-10 sm:flex-none"
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
