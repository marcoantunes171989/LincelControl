import {
  ChevronDown,
  ChevronUp,
  Database,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Settings2,
  ShieldAlert,
} from 'lucide-react'
import { StatusBadge } from '../StatusBadge'
import { DiagnosticStepList } from './DiagnosticStepList'
import { SettingsInput } from './SettingsInput'
import { useOracleIntegration } from '../../hooks/useOracleIntegration'
import type { OracleConnectionStatus } from '../../types/oracle'

const STATUS_LABELS: Record<OracleConnectionStatus, string> = {
  not_configured: 'Não configurado',
  password_required: 'Senha necessária',
  validating: 'Validando',
  connecting: 'Conectando',
  connected: 'Conectado',
  disconnecting: 'Desconectando',
  disconnected: 'Desconectado',
  error: 'Erro',
  oracle_client_unavailable: 'Oracle Client indisponível',
  tns_unavailable: 'TNS indisponível',
  database_unreachable: 'Banco inacessível',
}

function statusVariant(status: OracleConnectionStatus | undefined) {
  if (!status) return 'neutral' as const
  if (status === 'connected') return 'success' as const
  if (status === 'validating' || status === 'connecting' || status === 'disconnecting') return 'info' as const
  if (status === 'password_required' || status === 'disconnected' || status === 'not_configured') return 'warning' as const
  return 'danger' as const
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch {
    return value
  }
}

interface OracleIntegrationPageProps {
  onToast?: (message: string) => void
}

export function OracleIntegrationPage({ onToast }: OracleIntegrationPageProps) {
  const {
    form,
    status,
    aliases,
    stages,
    progress,
    busy,
    error,
    showPassword,
    showAdvanced,
    apiReachable,
    setShowPassword,
    setShowAdvanced,
    updateField,
    refreshStatus,
    loadAliases,
    logon,
    logoff,
    saveAdvanced,
  } = useOracleIntegration()

  const currentStatus: OracleConnectionStatus =
    status?.status && status.status in STATUS_LABELS ? status.status : 'not_configured'
  const connected = Boolean(status?.connected)

  const handleLogon = async () => {
    const ok = await logon()
    if (ok) onToast?.('Logon Oracle realizado com sucesso.')
  }

  const handleLogoff = async () => {
    const ok = await logoff()
    if (ok) onToast?.('Desconectado. Configuração preservada.')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Database size={18} className="text-blue-600" aria-hidden="true" />
              Integração Oracle
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Conexão no estilo PL/SQL Developer: informe Username, Password e Database (alias TNS) e clique em OK.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={statusVariant(currentStatus)}>{STATUS_LABELS[currentStatus]}</StatusBadge>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refreshStatus()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Atualizar
            </button>
          </div>
        </div>

        {apiReachable === false && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            API interna indisponível. Execute <code className="font-mono">npm run dev:server</code> (porta 8787).
          </div>
        )}

        {progress && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            {progress}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
      </section>

      {/* Oracle Logon — estilo PL/SQL */}
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm">
            <Database size={28} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Oracle Logon</h3>
            <p className="text-sm text-slate-500">Username, Password e Database (TNS)</p>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (connected) void handleLogoff()
            else void handleLogon()
          }}
        >
          <SettingsInput
            id="username"
            label="Username"
            value={form.username}
            onChange={(value) => updateField('username', value)}
            placeholder="ex.: intersolid"
            required
            disabled={busy || connected}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
              <span className="text-red-600"> *</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                autoComplete="current-password"
                disabled={busy || connected}
                placeholder={
                  status?.passwordAvailableInMemory && !form.password
                    ? 'Senha já disponível na API'
                    : ''
                }
                onChange={(event) => updateField('password', event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500">A senha não é salva em arquivo ou localStorage.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="database" className="text-sm font-medium text-slate-700">
              Database
              <span className="text-red-600"> *</span>
            </label>
            <div className="flex gap-2">
              <input
                id="database"
                list="tns-aliases"
                value={form.tnsAlias}
                disabled={busy || connected}
                placeholder="ex.: ORCL"
                onChange={(event) => updateField('tnsAlias', event.target.value.toUpperCase())}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              />
              <button
                type="button"
                disabled={busy || connected}
                title="Listar aliases do tnsnames.ora"
                onClick={() => void loadAliases().catch(() => undefined)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                …
              </button>
            </div>
            <datalist id="tns-aliases">
              {aliases.map((alias) => (
                <option key={alias} value={alias} />
              ))}
            </datalist>
            <p className="text-xs text-slate-500">Alias TNS definido no tnsnames.ora (como no campo Database do PL/SQL).</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Connect as</span>
            <select
              disabled
              className="min-h-11 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-600"
              defaultValue="Normal"
            >
              <option value="Normal">Normal</option>
            </select>
          </label>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {connected ? (
              <button
                type="submit"
                disabled={busy || apiReachable === false}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <LogOut size={16} aria-hidden="true" />
                Cancel / Desconectar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    updateField('password', '')
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || apiReachable === false}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  OK
                </button>
              </>
            )}
          </div>
        </form>
      </section>

      {/* Status resumido */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Sessão</h3>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Database</dt>
            <dd className="font-mono font-medium text-slate-800">{status?.database?.alias || form.tnsAlias || '—'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Usuário</dt>
            <dd className="font-medium text-slate-800">{status?.database?.sessionUser || form.username || '—'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Host / Serviço</dt>
            <dd className="font-medium text-slate-800">
              {status?.database?.host || '—'}
              {status?.database?.port ? `:${status.database.port}` : ''}{' '}
              {status?.database?.serviceName || status?.database?.sid
                ? `/ ${status.database.serviceName || status.database.sid}`
                : ''}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Última conexão</dt>
            <dd className="font-medium text-slate-800">{formatDate(status?.lastConnectedAt)}</dd>
          </div>
        </dl>
      </section>

      {/* Ambiente avançado */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Settings2 size={17} className="text-blue-600" aria-hidden="true" />
            Ambiente (Oracle Client / TNS_ADMIN)
          </span>
          {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <p className="mt-1 text-sm text-slate-500">
          Opcional se já estiver no <code className="font-mono">.env</code>. Equivale ao Instant Client usado pelo PL/SQL.
        </p>

        {showAdvanced && (
          <div className="mt-4 space-y-3">
            <SettingsInput
              id="oracleClientLibDir"
              label="Oracle Client (libDir)"
              value={form.oracleClientLibDir}
              onChange={(value) => updateField('oracleClientLibDir', value)}
              placeholder="C:\Oracle\instantclient_19_25"
            />
            <SettingsInput
              id="tnsAdminPath"
              label="TNS_ADMIN"
              value={form.tnsAdminPath}
              onChange={(value) => updateField('tnsAdminPath', value)}
              placeholder="\\SERVIDOR\Oracle\Network\Admin"
            />
            <SettingsInput
              id="tnsFileName"
              label="Arquivo TNS"
              value={form.tnsFileName}
              onChange={(value) => updateField('tnsFileName', value)}
              placeholder="tnsnames.ora"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void saveAdvanced().then((ok) => {
                  if (ok) onToast?.('Ambiente Oracle salvo.')
                })
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Salvar ambiente
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Diagnóstico da última conexão</h3>
        <p className="mt-1 text-sm text-slate-500">Etapas executadas no logon (TNS + autenticação).</p>
        <div className="mt-4">
          <DiagnosticStepList stages={stages} running={busy} />
        </div>
      </section>
    </div>
  )
}
