import {
  Cable,
  Database,
  Eye,
  EyeOff,
  FileSearch,
  HardDrive,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react'
import { StatusBadge } from '../StatusBadge'
import { ConnectionToggle } from './ConnectionToggle'
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
    selectedAliasInfo,
    stages,
    progress,
    busy,
    error,
    showPassword,
    apiReachable,
    setShowPassword,
    updateField,
    saveConfiguration,
    validateClient,
    loadAliases,
    selectAlias,
    runValidation,
    toggleConnection,
    refreshStatus,
  } = useOracleIntegration()

  const currentStatus = status?.status ?? 'not_configured'

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
              Configure o Oracle Client, o caminho do <code className="font-mono">tnsnames.ora</code> e conecte-se ao
              banco do cliente pela API interna. A senha nunca é salva em texto simples.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={statusVariant(currentStatus)}>
              {STATUS_LABELS[currentStatus]}
            </StatusBadge>
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
            API interna indisponível. Execute <code className="font-mono">npm run dev:server</code> (porta 8787) e
            confira <code className="font-mono">VITE_API_BASE_URL</code>.
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <HardDrive size={17} className="text-blue-600" aria-hidden="true" />
            Card 1 — Oracle Client
          </h3>
          <p className="mt-1 text-sm text-slate-500">Caminho local do Instant Client / Oracle Client (OCI.DLL).</p>
          <div className="mt-4 space-y-3">
            <SettingsInput
              id="oracleClientLibDir"
              label="Caminho do Oracle Client"
              value={form.oracleClientLibDir}
              onChange={(value) => updateField('oracleClientLibDir', value)}
              placeholder="C:\Oracle\instantclient_19_25"
              required
            />
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">OCI.DLL</dt>
                <dd className="font-medium text-slate-800">
                  {status?.ociDllFound === null || status?.ociDllFound === undefined
                    ? 'Não verificado'
                    : status.ociDllFound
                      ? 'Encontrada'
                      : 'Não encontrada'}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Versão / Arquitetura</dt>
                <dd className="font-medium text-slate-800">
                  {status?.clientVersion || '—'} / {status?.clientArchitecture || '—'}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              disabled={busy || !form.oracleClientLibDir}
              onClick={() => void validateClient().catch(() => undefined)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Validar Client
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <FileSearch size={17} className="text-blue-600" aria-hidden="true" />
            Card 2 — Arquivo TNS
          </h3>
          <p className="mt-1 text-sm text-slate-500">Prefira caminho UNC em vez de unidade mapeada.</p>
          <div className="mt-4 space-y-3">
            <SettingsInput
              id="tnsAdminPath"
              label="Diretório TNS_ADMIN"
              value={form.tnsAdminPath}
              onChange={(value) => updateField('tnsAdminPath', value)}
              placeholder="\\SERVIDOR-ARQUIVOS\Oracle\Network\Admin"
              required
            />
            <SettingsInput
              id="tnsFileName"
              label="Nome do arquivo"
              value={form.tnsFileName}
              onChange={(value) => updateField('tnsFileName', value)}
              placeholder="tnsnames.ora"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !form.tnsAdminPath}
                onClick={() => void loadAliases().catch(() => undefined)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Validar arquivo / listar aliases
              </button>
            </div>
            {aliases.length > 0 && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Alias TNS</span>
                <select
                  value={form.tnsAlias}
                  disabled={busy}
                  onChange={(event) => void selectAlias(event.target.value).catch(() => undefined)}
                  className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Selecione...</option>
                  {aliases.map((alias) => (
                    <option key={alias} value={alias}>
                      {alias}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SettingsInput
                id="expectedHost"
                label="HOST / IP esperado"
                value={form.expectedHost}
                onChange={(value) => updateField('expectedHost', value)}
                required
              />
              <SettingsInput
                id="expectedPort"
                label="PORT esperada"
                value={form.expectedPort}
                onChange={(value) => updateField('expectedPort', value)}
                required
              />
              <SettingsInput
                id="expectedDatabase"
                label="SERVICE_NAME ou SID"
                value={form.expectedDatabase}
                onChange={(value) => updateField('expectedDatabase', value)}
                required
              />
              <SettingsInput
                id="tnsAliasManual"
                label="Alias selecionado"
                value={form.tnsAlias}
                onChange={(value) => updateField('tnsAlias', value)}
                required
              />
            </div>
            {selectedAliasInfo && (
              <p className="text-xs text-slate-500">
                Extraído do TNS: {selectedAliasInfo.hosts.join(', ')}:{' '}
                {selectedAliasInfo.ports.join(', ')} / {selectedAliasInfo.serviceName || selectedAliasInfo.sid || '—'}
                {selectedAliasInfo.hasMultipleHosts ? ' (múltiplos hosts)' : ''}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <KeyRound size={17} className="text-blue-600" aria-hidden="true" />
            Card 3 — Credenciais
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            A senha permanece somente em memória no backend durante a execução do processo.
          </p>
          <div className="mt-4 space-y-3">
            <SettingsInput
              id="username"
              label="Usuário Oracle"
              value={form.username}
              onChange={(value) => updateField('username', value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha Oracle
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  autoComplete="off"
                  onChange={(event) => updateField('password', event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
              <p className="text-xs text-slate-500">A senha não será salva em texto simples, JSON ou localStorage.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveConfiguration()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Salvar configuração
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runValidation().catch(() => undefined)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                Validar credenciais
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Cable size={17} className="text-blue-600" aria-hidden="true" />
            Card 4 — Conexão
          </h3>
          <p className="mt-1 text-sm text-slate-500">Interruptor conectar/desconectar com preservação das configurações.</p>
          <div className="mt-4 space-y-4">
            <ConnectionToggle
              connected={Boolean(status?.connected)}
              busy={busy}
              disabled={apiReachable === false}
              onToggle={(enabled) => {
                void toggleConnection(enabled).then((ok) => {
                  if (ok) {
                    onToast?.(
                      enabled
                        ? 'Conexão Oracle ativada.'
                        : 'Conexão Oracle desligada. Configurações preservadas.',
                    )
                  }
                })
              }}
            />
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Última conexão</dt>
                <dd className="font-medium text-slate-800">{formatDate(status?.lastConnectedAt)}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Última validação</dt>
                <dd className="font-medium text-slate-800">
                  {formatDate(status?.lastValidatedAt)}
                  {status?.lastValidationDurationMs != null ? ` (${status.lastValidationDurationMs} ms)` : ''}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Pool aberto / em uso</dt>
                <dd className="font-medium text-slate-800">
                  {status?.pool
                    ? `${status.pool.connectionsOpen} / ${status.pool.connectionsInUse}`
                    : '—'}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Último erro</dt>
                <dd className="font-medium text-slate-800">{status?.lastError || '—'}</dd>
              </div>
            </dl>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 px-3 py-2">
                <dt className="text-xs text-slate-500">Alias / Usuário</dt>
                <dd className="font-medium text-slate-800">
                  {status?.database.alias || '—'} / {status?.database.sessionUser || form.username || '—'}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-100 px-3 py-2">
                <dt className="text-xs text-slate-500">Host:Porta / DB</dt>
                <dd className="font-medium text-slate-800">
                  {status?.database.host || '—'}:{status?.database.port || '—'} /{' '}
                  {status?.database.serviceName || status?.database.sid || '—'}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-100 px-3 py-2">
                <dt className="text-xs text-slate-500">Instância / Servidor</dt>
                <dd className="font-medium text-slate-800">
                  {status?.database.instanceName || '—'} / {status?.database.serverHost || '—'}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-100 px-3 py-2">
                <dt className="text-xs text-slate-500">Versão do banco</dt>
                <dd className="font-medium text-slate-800">{status?.database.oracleVersion || '—'}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Stethoscope size={17} className="text-blue-600" aria-hidden="true" />
          Card 5 — Diagnóstico
        </h3>
        <p className="mt-1 text-sm text-slate-500">Cada etapa da validação é exibida de forma independente.</p>
        <div className="mt-4">
          <DiagnosticStepList stages={stages} running={busy} />
        </div>
      </section>
    </div>
  )
}
