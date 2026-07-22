import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ValidationErrors } from '../types'

interface ValidationSummaryProps {
  errors: ValidationErrors
}

interface ErrorEntry {
  key: keyof ValidationErrors
  label: string
  targetId: string
  message: string
}

const FIELD_META: Record<keyof ValidationErrors, { label: string; targetId: string }> = {
  codLoja: { label: 'Código da loja', targetId: 'cod-loja' },
  numCgc: { label: 'CNPJ', targetId: 'num-cgc' },
  numLicenca: { label: 'Número da licença', targetId: 'num-licenca' },
  numDiaVencto: { label: 'Dia de vencimento do boleto', targetId: 'num-dia-vencto' },
  numPdv: { label: 'PDVs ativos', targetId: 'num-pdv' },
  numPdvBalcao: { label: 'PDV venda balcão', targetId: 'num-pdv-balcao' },
  numPdvReserva: { label: 'PDV reservas', targetId: 'num-pdv-reserva' },
  numPdvRecebto: { label: 'PDV recebimento', targetId: 'num-pdv-recebto' },
}

function focusField(targetId: string) {
  const element = document.getElementById(targetId)
  if (!element) return
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
  element.focus({ preventScroll: true })
}

export function ValidationSummary({ errors }: ValidationSummaryProps) {
  const entries = (Object.keys(FIELD_META) as (keyof ValidationErrors)[])
    .map((key): ErrorEntry | null => {
      const message = errors[key]
      if (!message) return null
      return { key, message, ...FIELD_META[key] }
    })
    .filter((entry): entry is ErrorEntry => entry !== null)

  if (entries.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
      >
        <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
        Nenhuma pendência — todos os campos obrigatórios estão válidos.
      </div>
    )
  }

  return (
    <div role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
        <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
        {entries.length} {entries.length === 1 ? 'pendência encontrada' : 'pendências encontradas'}
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={entry.key} className="flex flex-wrap items-center justify-between gap-2 text-sm text-red-700">
            <span>
              <strong className="font-semibold">{entry.label}:</strong> {entry.message}
            </span>
            <button
              type="button"
              onClick={() => focusField(entry.targetId)}
              className="shrink-0 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
            >
              Ir para o campo
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
