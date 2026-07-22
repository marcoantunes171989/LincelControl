import { KeyRound } from 'lucide-react'
import { FormField } from './FormField'
import type { LicenseData, ValidationErrors } from '../types'
import { sanitizeIntegerInput } from '../utils/formatters'

type LicenseErrors = Pick<
  ValidationErrors,
  'numLicenca' | 'numDiaVencto' | 'numPdv' | 'numPdvBalcao' | 'numPdvReserva' | 'numPdvRecebto'
>

interface LicensePdvCardProps {
  license: LicenseData
  errors: LicenseErrors
  onChange: <K extends keyof LicenseData>(field: K, value: LicenseData[K]) => void
}

export function LicensePdvCard({ license, errors, onChange }: LicensePdvCardProps) {
  return (
    <section
      id="licenca"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="license-heading"
    >
      <div className="mb-1">
        <h2 id="license-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <KeyRound size={18} className="text-blue-600" aria-hidden="true" />
          Licença e PDVs
        </h2>
        <p className="mt-1 text-sm text-slate-500">Todos os campos abaixo são incluídos no UPDATE gerado.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="num-licenca"
          label="Número da licença"
          dbField="NUM_LICENCA"
          value={license.numLicenca}
          onChange={(value) => onChange('numLicenca', sanitizeIntegerInput(value))}
          error={errors.numLicenca}
          inputMode="numeric"
          required
        />
        <FormField
          id="num-dia-vencto"
          label="Dia de vencimento do boleto"
          dbField="NUM_DIA_VENCTO"
          value={license.numDiaVencto}
          onChange={(value) => onChange('numDiaVencto', sanitizeIntegerInput(value))}
          error={errors.numDiaVencto}
          inputMode="numeric"
          maxLength={2}
          required
          stepper
          min={1}
          max={31}
        />
        <FormField
          id="num-pdv"
          label="PDVs ativos"
          dbField="NUM_PDV"
          value={license.numPdv}
          onChange={(value) => onChange('numPdv', sanitizeIntegerInput(value))}
          error={errors.numPdv}
          inputMode="numeric"
          required
          stepper
          min={0}
        />
        <FormField
          id="num-pdv-balcao"
          label="PDV venda balcão"
          dbField="NUM_PDV_BALCAO"
          value={license.numPdvBalcao}
          onChange={(value) => onChange('numPdvBalcao', sanitizeIntegerInput(value))}
          error={errors.numPdvBalcao}
          inputMode="numeric"
          required
          stepper
          min={0}
        />
        <FormField
          id="num-pdv-reserva"
          label="PDV reservas"
          dbField="NUM_PDV_RESERVA"
          value={license.numPdvReserva}
          onChange={(value) => onChange('numPdvReserva', sanitizeIntegerInput(value))}
          error={errors.numPdvReserva}
          inputMode="numeric"
          required
          stepper
          min={0}
        />
        <FormField
          id="num-pdv-recebto"
          label="PDV recebimento"
          dbField="NUM_PDV_RECEBTO"
          value={license.numPdvRecebto}
          onChange={(value) => onChange('numPdvRecebto', sanitizeIntegerInput(value))}
          error={errors.numPdvRecebto}
          inputMode="numeric"
          required
          stepper
          min={0}
        />
      </div>
    </section>
  )
}
