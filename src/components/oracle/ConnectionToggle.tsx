interface ConnectionToggleProps {
  connected: boolean
  disabled?: boolean
  busy?: boolean
  onToggle: (enabled: boolean) => void
}

export function ConnectionToggle({ connected, disabled, busy, onToggle }: ConnectionToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Interruptor de conexão Oracle">
      <span className={`text-sm font-medium ${connected ? 'text-slate-400' : 'text-slate-800'}`}>Desconectado</span>
      <button
        type="button"
        role="switch"
        aria-checked={connected}
        disabled={disabled || busy}
        onClick={() => onToggle(!connected)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 ${
          connected ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
            connected ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${connected ? 'text-emerald-700' : 'text-slate-400'}`}>Conectado</span>
    </div>
  )
}
