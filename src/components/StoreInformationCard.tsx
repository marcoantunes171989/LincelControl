import { Store } from 'lucide-react'
import { FormField } from './FormField'
import type { StoreData, ValidationErrors } from '../types'
import { formatCnpjMask, sanitizeIntegerInput } from '../utils/formatters'

interface StoreInformationCardProps {
  store: StoreData
  errors: Pick<ValidationErrors, 'codLoja' | 'numCgc'>
  onChange: <K extends keyof StoreData>(field: K, value: StoreData[K]) => void
  inscricaoEstadual: string
  isLoadingCnpjInfo: boolean
}

export function StoreInformationCard({
  store,
  errors,
  onChange,
  inscricaoEstadual,
  isLoadingCnpjInfo,
}: StoreInformationCardProps) {
  return (
    <section
      id="loja"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="store-info-heading"
    >
      <div className="mb-1">
        <h2 id="store-info-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Store size={18} className="text-blue-600" aria-hidden="true" />
          Informações da loja
        </h2>
        <p className="mt-1 text-sm text-slate-500">Identificação da loja que receberá o UPDATE na TAB_LOJA.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(11rem,1fr)_2fr_2fr]">
        <FormField
          id="cod-loja"
          label="Código da loja"
          dbField="COD_LOJA"
          value={store.codLoja}
          onChange={(value) => onChange('codLoja', sanitizeIntegerInput(value))}
          error={errors.codLoja}
          inputMode="numeric"
          required
        />
        <FormField
          id="num-cgc"
          label="CNPJ"
          dbField="NUM_CGC"
          value={store.numCgc}
          onChange={(value) => onChange('numCgc', formatCnpjMask(value))}
          error={errors.numCgc}
          inputMode="numeric"
          maxLength={18}
          placeholder="00.000.000/0000-00"
          required
        />
        <div className="sm:col-span-2 xl:col-span-1">
          <FormField
            id="inscricao-estadual"
            label="Insc. Estadual"
            dbField="COMENTÁRIO"
            value={inscricaoEstadual}
            readOnly
            loading={isLoadingCnpjInfo}
            placeholder="Preencha o CNPJ"
            hint="Consultada automaticamente ao completar o CNPJ (API pública CNPJ.ws). Sem registro encontrado → ISENTO. Aparece apenas no comentário do script."
          />
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <FormField
            id="descricao"
            label="Descrição"
            dbField="COMENTÁRIO"
            value={store.descricao}
            readOnly
            loading={isLoadingCnpjInfo}
            placeholder="Preencha o CNPJ"
            hint="Preenchida automaticamente com a razão social do CNPJ (API pública CNPJ.ws). Usada apenas para identificação e no comentário do script — não entra no SET do UPDATE."
          />
        </div>
      </div>
    </section>
  )
}
