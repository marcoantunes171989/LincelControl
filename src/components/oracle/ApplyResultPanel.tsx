import { CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import type { LicenseUpdateApplyResponse } from '../../types/oracle'

interface ApplyResultPanelProps {
  result: LicenseUpdateApplyResponse
  onDismiss: () => void
}

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch {
    return value
  }
}

export function ApplyResultPanel({ result, onDismiss }: ApplyResultPanelProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
      aria-live="polite"
      aria-label="Resultado da aplicação no Oracle"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Licença atualizada com sucesso no Oracle.</p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Loja {result.store.codLoja} · {result.database.alias || '—'}
              {result.database.serviceName ? ` / ${result.database.serviceName}` : ''} · {result.changedCount}{' '}
              campo(s) alterado(s) · {result.rowsAffected} registro(s) atualizado(s)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar resumo"
          className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((value) => !value)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
      >
        {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Ver detalhes
      </button>

      {showDetails && (
        <div className="mt-2 rounded-lg border border-emerald-200 bg-white p-3 text-xs text-slate-600">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div>
              <dt className="font-medium text-slate-400">Usuário Oracle</dt>
              <dd className="font-semibold text-slate-800">{result.database.username || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-400">Data/hora</dt>
              <dd className="font-semibold text-slate-800">{formatDateTime(result.appliedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-400">Duração</dt>
              <dd className="font-semibold text-slate-800">{result.durationMs} ms</dd>
            </div>
          </dl>
          {result.changedFields.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-2 py-1">Campo</th>
                    <th className="px-2 py-1">Anterior</th>
                    <th className="px-2 py-1">Novo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.changedFields.map((field) => (
                    <tr key={field.field}>
                      <td className="px-2 py-1 font-mono">{field.field}</td>
                      <td className="px-2 py-1 font-mono text-slate-400">{field.oldValue ?? '—'}</td>
                      <td className="px-2 py-1 font-mono font-semibold text-emerald-700">{field.newValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
