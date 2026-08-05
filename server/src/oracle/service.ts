import fs from 'node:fs/promises'
import path from 'node:path'
import type { Connection } from 'oracledb'
import { env } from '../config/env.js'
import {
  getOracleSettings,
  saveOracleSettings,
  updateOracleValidationMeta,
} from '../db/settingsStore.js'
import { resolveHost } from '../utils/dns.js'
import { logger } from '../utils/logger.js'
import { testTcpConnection } from '../utils/tcp.js'
import { runTnsPing } from '../utils/tnsping.js'
import { ensureThinDriver, getOracleClientState, getOracledb } from './client.js'
import { buildConnectString } from './connectString.js'
import { compareTnsWithExpected } from './comparison.js'
import { translateOracleError } from './errors.js'
import { getCatalogQuery, sanitizeBinds } from './queryCatalog.js'
import { findTnsAlias, listTnsAliases, parseTnsNames } from './tnsParser.js'
import type {
  DatabaseSessionInfo,
  OracleConfigurationInput,
  OracleConnectionSettings,
  OracleConnectionStatus,
  OracleRuntimeStatus,
  StageResult,
  TnsAliasInfo,
} from './types.js'

const POOL_ALIAS = env.oraclePoolAlias

class OracleIntegrationService {
  private passwordInMemory: string | null = null
  private status: OracleConnectionStatus = 'not_configured'
  private busy = false
  private lastError: string | null = null
  private lastValidationDurationMs: number | null = null
  private stages: StageResult[] = []
  private sessionInfo: DatabaseSessionInfo | null = null
  private parsedAlias: TnsAliasInfo | null = null
  private clientVersion: string | null = null
  private ociDllFound: boolean | null = null
  private acceptingQueries = false

  async bootstrap(): Promise<void> {
    try {
      const settings = getOracleSettings()
      if (!settings) {
        this.status = 'not_configured'
        return
      }

      this.status = settings.isEnabled ? 'password_required' : 'disconnected'

      const driver = ensureThinDriver()
      this.clientVersion = driver.clientVersion
      this.ociDllFound = false

      logger.info('Bootstrap Oracle concluído sem conexão automática', {
        configured: true,
        status: this.status,
        enabled: settings.isEnabled,
      })
    } catch (error) {
      logger.error('Erro no bootstrap Oracle (aplicação continua)', {
        message: error instanceof Error ? error.message : String(error),
      })
      this.status = 'error'
      this.lastError = error instanceof Error ? error.message : 'Falha no bootstrap Oracle'
    }
  }

  getSettings(): OracleConnectionSettings | null {
    return getOracleSettings()
  }

  saveConfiguration(input: OracleConfigurationInput): OracleConnectionSettings {
    const saved = saveOracleSettings(input)
    if (this.status === 'not_configured') {
      this.status = 'disconnected'
    }
    logger.info('Configuração Oracle salva', {
      tnsAlias: saved.tnsAlias,
      username: saved.username,
      expectedHost: saved.expectedHost,
    })
    return saved
  }

  setPassword(password: string | undefined | null): void {
    if (typeof password === 'string' && password.length > 0) {
      this.passwordInMemory = password
    }
  }

  clearPassword(): void {
    this.passwordInMemory = null
  }

  hasPassword(): boolean {
    return Boolean(this.passwordInMemory)
  }

  isConnected(): boolean {
    return this.acceptingQueries && this.status === 'connected'
  }

  private ensureNotBusy(): void {
    if (this.busy) {
      throw Object.assign(new Error('Já existe uma operação Oracle em andamento.'), {
        statusCode: 409,
        code: 'ORACLE_BUSY',
      })
    }
  }

  private pushStage(stage: StageResult): void {
    const index = this.stages.findIndex((item) => item.stage === stage.stage)
    if (index >= 0) this.stages[index] = stage
    else this.stages.push(stage)
  }

  private async readTnsFile(tnsAdminPath: string, tnsFileName: string): Promise<string> {
    const filePath = path.join(tnsAdminPath, tnsFileName)
    const content = await Promise.race([
      fs.readFile(filePath, 'utf8'),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout ao ler ${tnsFileName}`)), env.oracleTnsReadTimeoutMs)
      }),
    ])
    return content
  }

  async listAliases(tnsAdminPath?: string, tnsFileName?: string): Promise<{ aliases: string[]; filePath: string }> {
    const settings = getOracleSettings()
    const adminPath = (tnsAdminPath || settings?.tnsAdminPath || env.oracleTnsAdmin).trim()
    const fileName = (tnsFileName || settings?.tnsFileName || env.oracleTnsFileName).trim() || 'tnsnames.ora'

    if (!adminPath) {
      throw Object.assign(new Error('Caminho do TNS não informado.'), { statusCode: 400 })
    }

    await fs.access(adminPath)
    const filePath = path.join(adminPath, fileName)
    await fs.access(filePath)
    const content = await this.readTnsFile(adminPath, fileName)
    const aliases = listTnsAliases(content)
    logger.info('Aliases TNS listados', { count: aliases.length, filePath })
    return { aliases, filePath }
  }

  /**
   * Importa o conteúdo do tnsnames.ora enviado pelo navegador,
   * grava em DATA_DIR/network/admin e disponibiliza os aliases para logon.
   */
  async importTnsFile(content: string, fileName = 'tnsnames.ora'): Promise<{
    aliases: TnsAliasInfo[]
    aliasNames: string[]
    tnsAdminPath: string
    tnsFileName: string
    filePath: string
  }> {
    const trimmed = content?.trim()
    if (!trimmed) {
      throw Object.assign(new Error('Arquivo TNS vazio.'), { statusCode: 400 })
    }

    const aliases = parseTnsNames(trimmed)
    if (aliases.length === 0) {
      throw Object.assign(new Error('Nenhum alias TNS encontrado no arquivo importado.'), { statusCode: 400 })
    }

    const safeName = (fileName || 'tnsnames.ora').replace(/[^\w.\-]/g, '') || 'tnsnames.ora'
    const adminPath = path.join(env.dataDir, 'network', 'admin')
    await fs.mkdir(adminPath, { recursive: true })
    const filePath = path.join(adminPath, safeName)
    await fs.writeFile(filePath, trimmed, 'utf8')

    process.env.TNS_ADMIN = adminPath

    const current = getOracleSettings()
    saveOracleSettings({
      tnsAdminPath: adminPath,
      tnsFileName: safeName,
      tnsAlias: current?.tnsAlias || aliases[0].alias,
      oracleClientLibDir: current?.oracleClientLibDir || env.oracleClientLibDir,
      expectedHost: aliases[0].hosts[0] || current?.expectedHost || '',
      expectedPort: aliases[0].ports[0] ?? current?.expectedPort ?? 1521,
      expectedDatabase: aliases[0].serviceName || aliases[0].sid || current?.expectedDatabase || '',
      username: current?.username || '',
    })

    logger.info('Arquivo TNS importado pelo navegador', {
      filePath,
      aliasCount: aliases.length,
    })

    return {
      aliases,
      aliasNames: aliases.map((item) => item.alias),
      tnsAdminPath: adminPath,
      tnsFileName: safeName,
      filePath,
    }
  }

  async validateConfiguration(options?: {
    password?: string
    includeAuth?: boolean
    /** simple = fluxo PL/SQL (TNS + usuário/senha). full = diagnósticos extras. */
    mode?: 'simple' | 'full'
    actor?: string
  }): Promise<{ ok: boolean; stages: StageResult[]; alias: TnsAliasInfo | null }> {
    this.ensureNotBusy()
    this.busy = true
    this.status = 'validating'
    this.stages = []
    const started = Date.now()
    const mode = options?.mode ?? 'simple'

    try {
      const settings = getOracleSettings()
      if (!settings?.tnsAlias || !settings.username) {
        this.status = 'not_configured'
        throw Object.assign(new Error('Informe Database (TNS) e Username para conectar.'), { statusCode: 400 })
      }

      if (options?.password) this.setPassword(options.password)
      logger.info('Início de validação Oracle', {
        actor: options?.actor ?? 'system',
        alias: settings.tnsAlias,
        mode,
      })

      const libDir = settings.oracleClientLibDir || env.oracleClientLibDir
      const tnsAdmin = settings.tnsAdminPath || env.oracleTnsAdmin

      // 1. Driver Thin (sem Instant Client / OCI.DLL)
      const clientStarted = Date.now()
      const client = ensureThinDriver()
      this.clientVersion = client.clientVersion
      this.ociDllFound = false
      this.pushStage({
        stage: 'oracle-driver',
        ok: true,
        status: 'success',
        message: client.message,
        durationMs: Date.now() - clientStarted,
        details: {
          mode: 'thin',
          architecture: client.architecture,
          clientVersion: client.clientVersion,
        },
      })

      // 2–3. TNS / alias — preferimos HOST:PORT/SERVICE do arquivo importado
      let aliasInfo: TnsAliasInfo | null = null
      if (tnsAdmin) {
        const tnsStarted = Date.now()
        try {
          await fs.access(tnsAdmin)
          const filePath = path.join(tnsAdmin, settings.tnsFileName || 'tnsnames.ora')
          await fs.access(filePath)
          const content = await this.readTnsFile(tnsAdmin, settings.tnsFileName || 'tnsnames.ora')
          this.pushStage({
            stage: 'tns-file',
            ok: true,
            status: 'success',
            message: `Arquivo TNS lido (${settings.tnsFileName || 'tnsnames.ora'}).`,
            durationMs: Date.now() - tnsStarted,
            details: { filePath, aliasCount: parseTnsNames(content).length },
          })

          aliasInfo = findTnsAlias(content, settings.tnsAlias)
          this.parsedAlias = aliasInfo
          this.pushStage({
            stage: 'tns-alias',
            ok: Boolean(aliasInfo),
            status: aliasInfo ? 'success' : mode === 'simple' ? 'warning' : 'error',
            message: aliasInfo
              ? `Database ${aliasInfo.alias} encontrado no TNS.`
              : `Alias ${settings.tnsAlias} não listado no tnsnames.ora. Tentando conexão direta pelo Client.`,
            details: aliasInfo
              ? {
                  hosts: aliasInfo.hosts,
                  ports: aliasInfo.ports,
                  serviceName: aliasInfo.serviceName,
                  sid: aliasInfo.sid,
                }
              : undefined,
          })

          if (!aliasInfo && mode === 'full') {
            this.status = 'tns_unavailable'
            this.lastError = `Alias ${settings.tnsAlias} não encontrado.`
            return { ok: false, stages: this.stages, alias: null }
          }

          // Auto-preenche host/porta/banco a partir do TNS (estilo PL/SQL)
          if (aliasInfo) {
            saveOracleSettings({
              tnsAdminPath: tnsAdmin,
              tnsFileName: settings.tnsFileName,
              tnsAlias: settings.tnsAlias,
              oracleClientLibDir: libDir,
              expectedHost: aliasInfo.hosts[0] || settings.expectedHost,
              expectedPort: aliasInfo.ports[0] ?? settings.expectedPort,
              expectedDatabase: aliasInfo.serviceName || aliasInfo.sid || settings.expectedDatabase,
              username: settings.username,
            })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha ao ler TNS'
          this.pushStage({
            stage: 'tns-file',
            ok: mode === 'simple',
            status: mode === 'simple' ? 'warning' : 'error',
            message:
              mode === 'simple'
                ? `TNS local não lido (${message}). Conexão seguirá pelo alias informado, como no PL/SQL.`
                : `TNS indisponível: ${message}`,
            durationMs: Date.now() - tnsStarted,
          })
          if (mode === 'full') {
            this.status = 'tns_unavailable'
            this.lastError = message
            return { ok: false, stages: this.stages, alias: null }
          }
        }
      } else {
        this.pushStage({
          stage: 'tns-file',
          ok: true,
          status: 'skipped',
          message: 'TNS_ADMIN não informado. Usando resolução padrão do Oracle Client.',
        })
      }

      const latest = getOracleSettings() || settings
      const host = latest.expectedHost || aliasInfo?.hosts[0] || ''
      const port = latest.expectedPort || aliasInfo?.ports[0] || 1521

      if (mode === 'full' && host) {
        const comparison = compareTnsWithExpected(aliasInfo || {
          alias: latest.tnsAlias,
          hosts: host ? [host] : [],
          ports: [Number(port)],
          protocols: [],
          serviceName: latest.expectedDatabase || null,
          sid: null,
          addresses: [],
          hasFailover: false,
          hasMultipleHosts: false,
        }, {
          host: latest.expectedHost,
          port: Number(latest.expectedPort),
          database: latest.expectedDatabase,
        })
        this.pushStage({
          stage: 'tns-comparison',
          ok: comparison.ok,
          status: comparison.ok ? (comparison.warning ? 'warning' : 'success') : 'error',
          message: comparison.message,
          expected: comparison.expected,
          found: comparison.found,
        })
        if (!comparison.ok) {
          this.status = 'error'
          this.lastError = comparison.message
          return { ok: false, stages: this.stages, alias: aliasInfo }
        }

        const dns = await resolveHost(host)
        this.pushStage({
          stage: 'dns',
          ok: dns.ok,
          status: dns.ok ? 'success' : 'error',
          message: dns.message,
          details: { addresses: dns.addresses, isIp: dns.isIp },
        })
        if (!dns.ok) {
          this.status = 'database_unreachable'
          this.lastError = dns.message
          return { ok: false, stages: this.stages, alias: aliasInfo }
        }

        const tcp = await testTcpConnection(host, Number(port), env.oracleTcpTimeoutMs)
        this.pushStage({
          stage: 'tcp',
          ok: tcp.ok,
          status: tcp.ok ? 'success' : 'error',
          message: tcp.ok
            ? tcp.message
            : `Não foi possível acessar o servidor Oracle em ${host}:${port}.`,
          durationMs: tcp.durationMs,
        })
        if (!tcp.ok) {
          this.status = 'database_unreachable'
          this.lastError = tcp.message
          return { ok: false, stages: this.stages, alias: aliasInfo }
        }
      } else {
        this.pushStage({
          stage: 'tns-comparison',
          ok: true,
          status: 'skipped',
          message: 'Modo logon simples: validação direta por TNS + usuário/senha.',
        })
        this.pushStage({
          stage: 'dns',
          ok: true,
          status: 'skipped',
          message: 'DNS omitido no modo logon simples.',
        })
        this.pushStage({
          stage: 'tcp',
          ok: true,
          status: 'skipped',
          message: 'Teste TCP omitido no modo logon simples.',
        })
      }

      // TNSPING (opcional)
      if (tnsAdmin) process.env.TNS_ADMIN = tnsAdmin
      const ping = await runTnsPing(latest.tnsAlias, libDir)
      this.pushStage({
        stage: 'tnsping',
        ok: ping.available ? ping.ok : true,
        status: !ping.available ? 'skipped' : ping.ok ? 'success' : 'warning',
        message: ping.summary,
        durationMs: ping.durationMs,
        details: {
          available: ping.available,
          exitCode: ping.exitCode,
          executable: ping.executable,
        },
      })

      const includeAuth = options?.includeAuth !== false
      if (!includeAuth) {
        this.status = this.hasPassword() ? 'disconnected' : 'password_required'
        this.lastValidationDurationMs = Date.now() - started
        updateOracleValidationMeta({
          lastValidationStatus: 'partial_ok',
          lastValidationMessage: 'Validação de TNS concluída.',
          lastValidatedAt: new Date().toISOString(),
        })
        return { ok: true, stages: this.stages, alias: aliasInfo }
      }

      if (!this.passwordInMemory) {
        this.pushStage({
          stage: 'authentication',
          ok: false,
          status: 'error',
          message: 'Informe a senha Oracle.',
        })
        this.status = 'password_required'
        this.lastError = 'Senha necessária'
        return { ok: false, stages: this.stages, alias: aliasInfo }
      }

      // Autenticação + DUAL (equivalente ao OK do PL/SQL Developer)
      const authStarted = Date.now()
      const oracledb = getOracledb()
      const connectString = buildConnectString(
        {
          host: latest.expectedHost,
          port: latest.expectedPort,
          serviceName: aliasInfo?.serviceName || (!aliasInfo?.sid ? latest.expectedDatabase : null),
          sid: aliasInfo?.sid && !aliasInfo.serviceName ? aliasInfo.sid : null,
          tnsAlias: latest.tnsAlias,
        },
        aliasInfo,
      )
      this.pushStage({
        stage: 'connect-string',
        ok: true,
        status: 'success',
        message: `Connect string Thin: ${connectString}`,
        details: { connectString },
      })
      let connection: Connection | null = null
      try {
        connection = await oracledb.getConnection({
          user: latest.username,
          password: this.passwordInMemory,
          connectString,
        })

        const dual = await connection.execute<{ RESULTADO: number }>(
          'SELECT 1 AS RESULTADO FROM DUAL',
          {},
          { outFormat: oracledb.OUT_FORMAT_OBJECT },
        )
        const dualOk = Array.isArray(dual.rows) && dual.rows.length > 0

        this.pushStage({
          stage: 'authentication',
          ok: true,
          status: 'success',
          message: 'Usuário e senha Oracle validados.',
          durationMs: Date.now() - authStarted,
        })
        this.pushStage({
          stage: 'dual-query',
          ok: dualOk,
          status: dualOk ? 'success' : 'error',
          message: dualOk ? 'Consulta em DUAL executada com sucesso.' : 'Consulta em DUAL não retornou resultado.',
        })

        const session = await connection.execute<Record<string, string>>(
          `
          SELECT
            SYS_CONTEXT('USERENV', 'SESSION_USER') AS SESSION_USER,
            SYS_CONTEXT('USERENV', 'DB_NAME') AS DATABASE_NAME,
            SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE_NAME,
            SYS_CONTEXT('USERENV', 'INSTANCE_NAME') AS INSTANCE_NAME,
            SYS_CONTEXT('USERENV', 'SERVER_HOST') AS SERVER_HOST,
            SYS_CONTEXT('USERENV', 'CON_NAME') AS CONTAINER_NAME
          FROM DUAL
          `,
          {},
          { outFormat: oracledb.OUT_FORMAT_OBJECT },
        )

        const row = (session.rows?.[0] ?? {}) as Record<string, string>
        let oracleVersion: string | null = null
        try {
          const versionResult = await connection.execute<Record<string, string>>(
            `
            SELECT BANNER AS ORACLE_VERSION
            FROM PRODUCT_COMPONENT_VERSION
            WHERE PRODUCT LIKE 'Oracle%'
            FETCH FIRST 1 ROWS ONLY
            `,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT },
          )
          oracleVersion = (versionResult.rows?.[0] as Record<string, string> | undefined)?.ORACLE_VERSION ?? null
        } catch {
          oracleVersion = null
        }

        this.sessionInfo = {
          sessionUser: row.SESSION_USER ?? latest.username,
          databaseName: row.DATABASE_NAME ?? null,
          serviceName: row.SERVICE_NAME ?? aliasInfo?.serviceName ?? null,
          instanceName: row.INSTANCE_NAME ?? null,
          serverHost: row.SERVER_HOST ?? null,
          containerName: row.CONTAINER_NAME ?? null,
          oracleVersion,
        }

        logger.info('Tentativa de conexão Oracle bem-sucedida', {
          actor: options?.actor ?? 'system',
          alias: latest.tnsAlias,
          username: latest.username,
        })
      } catch (error) {
        const translated = translateOracleError(error, 'authentication')
        this.pushStage({
          stage: 'authentication',
          ok: false,
          status: 'error',
          message: translated.message,
          details: { code: translated.code },
        })
        this.status = 'error'
        this.lastError = translated.message
        logger.error('Erro de conexão Oracle', translated)
        return { ok: false, stages: this.stages, alias: aliasInfo }
      } finally {
        if (connection) {
          try {
            await connection.close()
          } catch {
            /* ignore */
          }
        }
      }

      this.lastValidationDurationMs = Date.now() - started
      this.lastError = null
      this.status = this.acceptingQueries ? 'connected' : 'disconnected'
      updateOracleValidationMeta({
        lastValidationStatus: 'ok',
        lastValidationMessage: 'Validação completa concluída com sucesso.',
        lastValidatedAt: new Date().toISOString(),
      })

      return { ok: true, stages: this.stages, alias: aliasInfo }
    } finally {
      this.busy = false
      this.lastValidationDurationMs = this.lastValidationDurationMs ?? Date.now() - started
    }
  }

  async connectOraclePool(options?: { password?: string; actor?: string }): Promise<OracleRuntimeStatus> {
    this.ensureNotBusy()
    if (options?.password) this.setPassword(options.password)
    if (!this.passwordInMemory) {
      this.status = 'password_required'
      throw Object.assign(new Error('Senha Oracle necessária para conectar.'), {
        statusCode: 400,
        code: 'PASSWORD_REQUIRED',
      })
    }

    this.busy = true
    this.status = 'connecting'

    try {
      const settings = getOracleSettings()
      if (!settings) {
        this.status = 'not_configured'
        throw Object.assign(new Error('Configuração Oracle ausente.'), { statusCode: 400 })
      }

      this.busy = false
      const validation = await this.validateConfiguration({
        password: this.passwordInMemory,
        includeAuth: true,
        mode: 'simple',
        actor: options?.actor,
      })
      this.busy = true

      if (!validation.ok) {
        throw Object.assign(new Error(this.lastError || 'Validação Oracle falhou.'), {
          statusCode: 400,
          stages: validation.stages,
        })
      }

      const oracledb = getOracledb()
      const poolStarted = Date.now()

      try {
        const existing = oracledb.getPool(POOL_ALIAS)
        if (existing) {
          this.pushStage({
            stage: 'pool',
            ok: true,
            status: 'warning',
            message: 'Pool Oracle já existia; reutilizando instância.',
            durationMs: Date.now() - poolStarted,
          })
        }
      } catch {
        const connectString = buildConnectString(
          {
            host: settings.expectedHost,
            port: settings.expectedPort,
            serviceName:
              this.parsedAlias?.serviceName ||
              (!this.parsedAlias?.sid ? settings.expectedDatabase : null),
            sid:
              this.parsedAlias?.sid && !this.parsedAlias.serviceName ? this.parsedAlias.sid : null,
            tnsAlias: settings.tnsAlias,
          },
          this.parsedAlias,
        )
        await oracledb.createPool({
          poolAlias: POOL_ALIAS,
          user: settings.username,
          password: this.passwordInMemory,
          connectString,
          poolMin: env.oraclePoolMin,
          poolMax: env.oraclePoolMax,
          poolIncrement: env.oraclePoolIncrement,
          poolTimeout: env.oraclePoolTimeout,
          queueTimeout: env.oracleQueueTimeoutMs,
          stmtCacheSize: 30,
        })
        this.pushStage({
          stage: 'pool',
          ok: true,
          status: 'success',
          message: 'Pool de conexões Oracle criado.',
          durationMs: Date.now() - poolStarted,
        })
      }

      this.acceptingQueries = true
      this.status = 'connected'
      this.lastError = null
      const now = new Date().toISOString()
      updateOracleValidationMeta({
        isEnabled: true,
        lastValidationStatus: 'ok',
        lastValidationMessage: 'Conectado com sucesso.',
        lastValidatedAt: now,
        lastConnectedAt: now,
      })

      logger.info('Conexão Oracle realizada', {
        actor: options?.actor ?? 'system',
        alias: settings.tnsAlias,
      })

      return this.getStatus()
    } catch (error) {
      const current = this.status as OracleConnectionStatus
      if (current !== 'password_required' && current !== 'oracle_client_unavailable') {
        this.status = 'error'
      }
      this.lastError = error instanceof Error ? error.message : 'Falha ao conectar'
      throw error
    } finally {
      this.busy = false
    }
  }

  async disconnectOraclePool(options?: { actor?: string }): Promise<OracleRuntimeStatus> {
    this.ensureNotBusy()
    this.busy = true
    this.status = 'disconnecting'
    this.acceptingQueries = false

    try {
      const oracledb = getOracledb()
      try {
        const pool = oracledb.getPool(POOL_ALIAS)
        await Promise.race([
          pool.close(0),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout ao encerrar pool Oracle')), env.oraclePoolCloseTimeoutMs)
          }),
        ])
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!/NJS-047|not found|does not exist/i.test(message)) {
          logger.warn('Aviso ao fechar pool Oracle', { message })
        }
      }

      updateOracleValidationMeta({
        isEnabled: false,
        lastValidationStatus: 'disconnected',
        lastValidationMessage: 'Desconectado manualmente.',
      })

      this.status = 'disconnected'
      this.lastError = null
      logger.info('Desconexão Oracle realizada', { actor: options?.actor ?? 'system' })
      return this.getStatus()
    } finally {
      this.busy = false
    }
  }

  async reconnectOraclePool(options?: { password?: string; actor?: string }): Promise<OracleRuntimeStatus> {
    if (this.isConnected()) {
      await this.disconnectOraclePool({ actor: options?.actor })
    }
    return this.connectOraclePool(options)
  }

  async toggle(enabled: boolean, password?: string, actor?: string): Promise<OracleRuntimeStatus> {
    if (enabled) return this.connectOraclePool({ password, actor })
    return this.disconnectOraclePool({ actor })
  }

  private getPoolStats() {
    try {
      const pool = getOracledb().getPool(POOL_ALIAS)
      return {
        connectionsOpen: pool.connectionsOpen,
        connectionsInUse: pool.connectionsInUse,
      }
    } catch {
      return null
    }
  }

  async getOracleConnection() {
    if (!this.acceptingQueries || this.status !== 'connected') {
      throw Object.assign(new Error('Pool Oracle desconectado. Ligue o interruptor para consultar.'), {
        statusCode: 503,
        code: 'ORACLE_DISCONNECTED',
      })
    }
    const pool = getOracledb().getPool(POOL_ALIAS)
    return pool.getConnection()
  }

  async executeCatalogQuery(queryId: string, binds?: Record<string, unknown>, actor?: string) {
    const queryStarted = Date.now()
    const query = getCatalogQuery(queryId)
    const safeBinds = sanitizeBinds(query, binds, env.oracleMaxRows)
    const oracledb = getOracledb()
    let connection: Connection | null = null

    try {
      connection = await this.getOracleConnection()
      const result = await Promise.race([
        connection.execute(query.sql, safeBinds as Record<string, string | number>, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          maxRows: env.oracleMaxRows,
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na execução da consulta Oracle')), env.oracleDbCallTimeoutMs)
        }),
      ])

      const durationMs = Date.now() - queryStarted
      logger.info('Consulta Oracle executada', {
        actor: actor ?? 'system',
        queryId,
        durationMs,
      })

      const typed = result as { rows?: unknown[]; metaData?: unknown[] }
      return {
        ok: true,
        queryId,
        description: query.description,
        rows: typed.rows ?? [],
        metaData: typed.metaData ?? [],
        durationMs,
      }
    } catch (error) {
      const err = error as { code?: string; statusCode?: number; message?: string }
      if (err.code === 'ORACLE_DISCONNECTED') {
        throw error
      }
      const translated = translateOracleError(error, 'pool')
      logger.error('Erro ao executar consulta Oracle', {
        queryId,
        code: translated.code,
        message: translated.message,
      })
      throw Object.assign(new Error(translated.message), {
        statusCode: err.statusCode ?? 400,
        code: translated.code,
        technicalMessage: translated.technicalMessage,
      })
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch {
          /* ignore */
        }
      }
    }
  }

  getStatus(): OracleRuntimeStatus {
    const settings = getOracleSettings()
    const client = getOracleClientState()
    const configured = Boolean(
      settings?.tnsAlias &&
        settings.username &&
        (settings.expectedHost || settings.tnsAdminPath || env.oracleTnsAdmin),
    )

    let status = this.status
    if (!configured) status = 'not_configured'
    else if (configured && !this.hasPassword() && status === 'disconnected') status = 'password_required'

    return {
      configured,
      enabled: Boolean(settings?.isEnabled) || this.isConnected(),
      connected: this.isConnected(),
      status,
      passwordAvailableInMemory: this.hasPassword(),
      clientInitialized: client.initialized,
      clientVersion: this.clientVersion ?? client.clientVersion,
      clientArchitecture: client.architecture,
      ociDllFound: this.ociDllFound,
      pool: this.getPoolStats(),
      database: {
        alias: settings?.tnsAlias ?? this.parsedAlias?.alias ?? null,
        host: settings?.expectedHost ?? this.parsedAlias?.hosts[0] ?? null,
        port: settings?.expectedPort ?? this.parsedAlias?.ports[0] ?? null,
        serviceName: this.parsedAlias?.serviceName ?? this.sessionInfo?.serviceName ?? null,
        sid: this.parsedAlias?.sid ?? null,
        instanceName: this.sessionInfo?.instanceName ?? null,
        serverHost: this.sessionInfo?.serverHost ?? null,
        databaseName: this.sessionInfo?.databaseName ?? null,
        sessionUser: this.sessionInfo?.sessionUser ?? settings?.username ?? null,
        oracleVersion: this.sessionInfo?.oracleVersion ?? null,
      },
      paths: {
        tnsAdminPath: settings?.tnsAdminPath ?? null,
        tnsFileName: settings?.tnsFileName ?? null,
        oracleClientLibDir: settings?.oracleClientLibDir ?? null,
      },
      lastValidatedAt: settings?.lastValidatedAt ?? null,
      lastConnectedAt: settings?.lastConnectedAt ?? null,
      lastValidationDurationMs: this.lastValidationDurationMs,
      lastError: this.lastError,
      stages: this.stages,
    }
  }

  getHealth() {
    const status = this.getStatus()
    const healthy = !status.configured || status.connected || status.status === 'password_required' || status.status === 'disconnected'
    return {
      service: 'oracle-integration',
      status: healthy ? (status.connected ? 'healthy' : 'degraded') : 'unhealthy',
      configured: status.configured,
      connected: status.connected,
      databaseReachable: status.connected,
      checkedAt: new Date().toISOString(),
    }
  }

  async shutdown(): Promise<void> {
    this.acceptingQueries = false
    try {
      const pool = getOracledb().getPool(POOL_ALIAS)
      await pool.close(0)
      logger.info('Pool Oracle encerrado no shutdown')
    } catch {
      /* pool inexistente */
    }
    this.status = 'disconnected'
  }
}

export const oracleService = new OracleIntegrationService()

export const initializeOracleClientSingleton = ensureThinDriver
export const validateOracleConfiguration = (options?: { password?: string; includeAuth?: boolean; actor?: string }) =>
  oracleService.validateConfiguration(options)
export const validateOracleCredentials = (password?: string, actor?: string) =>
  oracleService.validateConfiguration({ password, includeAuth: true, actor })
export const connectOraclePool = (options?: { password?: string; actor?: string }) =>
  oracleService.connectOraclePool(options)
export const disconnectOraclePool = (options?: { actor?: string }) => oracleService.disconnectOraclePool(options)
export const reconnectOraclePool = (options?: { password?: string; actor?: string }) =>
  oracleService.reconnectOraclePool(options)
export const getOracleConnection = () => oracleService.getOracleConnection()
export const getOracleStatus = () => oracleService.getStatus()
export const executeCatalogQuery = (queryId: string, binds?: Record<string, unknown>, actor?: string) =>
  oracleService.executeCatalogQuery(queryId, binds, actor)
