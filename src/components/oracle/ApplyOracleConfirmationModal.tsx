import { AlertTriangle, DatabaseZap, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { LicenseUpdatePreviewResponse } from '../../types/oracle'
import { formatCnpjMask } from '../../utils/formatters'

interface ApplyOracleConfirmationModalProps {
  open: boolean
  preview: LicenseUpdatePreviewResponse | null
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ApplyOracleConfirmationModal({
  open,
  preview,
  busy,
  onCancel,
  onConfirm,
}: ApplyOracleConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, busy, onCancel])

  if (!open || !preview) return null

  const hasChanges = preview.changedCount > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="apply-oracle-modal-title"
        aria-describedby="apply-oracle-modal-description"
        className="mx-4 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:mx-0 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <DatabaseZap size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="apply-oracle-modal-title" className="text-base font-semibold text-slate-900">
              Atualização da base Oracle
            </h2>
            <p id="apply-oracle-modal-description" className="mt-1 text-sm text-slate-600">
              Confira os dados antes de confirmar. Esta ação atualizará diretamente a TAB_LOJA do banco Oracle
              selecionado.
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Loja</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{preview.store.codLoja}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">CNPJ</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{formatCnpjMask(preview.store.cnpj)}</dd>
          </div>
          {preview.store.descricao && (
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Descrição</dt>
              <dd className="truncate font-semibold text-slate-900">{preview.store.descricao}</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Alias</dt>
            <dd className="font-mono font-semibold text-slate-900">{preview.database.alias || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Host:Porta</dt>
            <dd className="font-mono font-semibold text-slate-900">
              {preview.database.host || '—'}
              {preview.database.port ? `:${preview.database.port}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Service</dt>
            <dd className="font-mono font-semibold text-slate-900">{preview.database.serviceName || '—'}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Usuário Oracle</dt>
            <dd className="font-semibold text-slate-900">{preview.database.username || '—'}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-800">
            {hasChanges ? `${preview.changedCount} campo(s) serão alterados.` : preview.message}
          </p>

          {hasChanges && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Campo
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Atual
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Novo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.changedFields.map((field) => (
                    <tr key={field.field}>
                      <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs font-medium text-slate-700">
                        {field.field}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{field.oldValue ?? '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs font-semibold text-emerald-700">
                        {field.newValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {hasChanges ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Esta operação atualizará diretamente a TAB_LOJA do banco Oracle selecionado.</span>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Nenhuma alteração necessária — nada será enviado ao Oracle.</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={busy || !hasChanges}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <DatabaseZap size={16} aria-hidden="true" />}
            Aplicar atualização
          </button>
        </div>
      </div>
    </div>
  )
}
