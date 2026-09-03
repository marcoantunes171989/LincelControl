import { useEffect, useRef } from 'react'

interface ConfirmationModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    confirmButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-description"
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:mx-0 sm:p-6"
      >
        <h2 id="confirmation-modal-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <p id="confirmation-modal-description" className="mt-2 text-sm text-slate-600">
          {description}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 lg:min-h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`min-h-11 lg:min-h-9 rounded-lg text-sm font-semibold text-white transition ${
              tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
