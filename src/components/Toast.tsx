interface ToastProps {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {message && (
        <div className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {message}
        </div>
      )}
    </div>
  )
}
