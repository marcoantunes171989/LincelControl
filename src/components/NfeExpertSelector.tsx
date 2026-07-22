import { Receipt } from 'lucide-react'
import { DatabaseFieldBadge } from './DatabaseFieldBadge'
import type { NfeExpertMode } from '../types'
import { NFE_EXPERT_EMBEDDED_FIELD, NFE_EXPERT_PARTNER_FIELD } from '../data/modules'

interface NfeExpertSelectorProps {
  value: NfeExpertMode
  onChange: (mode: NfeExpertMode) => void
}

const OPTIONS: { value: NfeExpertMode; label: string }[] = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: 'embedded', label: 'Embedded' },
  { value: 'partner', label: 'Partner' },
]

export function NfeExpertSelector({ value, onChange }: NfeExpertSelectorProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 id="nfe-expert-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Receipt size={16} className="text-blue-600" aria-hidden="true" />
        Modalidade NF-e Expert
      </h3>

      <div
        role="radiogroup"
        aria-labelledby="nfe-expert-heading"
        className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
      >
        {OPTIONS.map((option) => {
          const isSelected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-lg px-2 text-sm font-medium transition ${
                isSelected ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-slate-500">Embedded e Partner não podem ser ativados simultaneamente.</p>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
          <dt>
            <DatabaseFieldBadge field={NFE_EXPERT_EMBEDDED_FIELD} />
          </dt>
          <dd
            className={`rounded-full px-2 py-0.5 font-bold ${
              value === 'embedded' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {value === 'embedded' ? 'S' : 'N'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
          <dt>
            <DatabaseFieldBadge field={NFE_EXPERT_PARTNER_FIELD} />
          </dt>
          <dd
            className={`rounded-full px-2 py-0.5 font-bold ${
              value === 'partner' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {value === 'partner' ? 'S' : 'N'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
