import oracledb from 'oracledb'
import { logger } from '../utils/logger.js'

let ready = false
let driverVersion: string | null = null

export interface OracleClientValidation {
  ok: boolean
  libDir: string
  configDir: string | null
  ociDllPath: string | null
  ociDllFound: boolean
  architecture: string
  clientVersion: string | null
  initialized: boolean
  message: string
  mode: 'thin'
  code?: string | null
  technicalMessage?: string
}

/**
 * Prepara o driver node-oracledb em modo Thin.
 * Não usa Instant Client / OCI.DLL — conecta via Easy Connect (host:port/service).
 */
export function ensureThinDriver(): OracleClientValidation {
  const architecture = process.arch

  if (!ready) {
    // Garante que não tentamos Thick por acidente neste processo.
    try {
      // thin é o padrão do oracledb 6+ quando initOracleClient não é chamado
      driverVersion =
        typeof oracledb.versionString === 'string'
          ? `${oracledb.versionString} (thin)`
          : 'oracledb-thin'
    } catch {
      driverVersion = 'oracledb-thin'
    }
    ready = true
    logger.info('Driver Oracle Thin pronto (sem Instant Client / OCI.DLL)', {
      driverVersion,
      architecture,
    })
  }

  return {
    ok: true,
    libDir: '',
    configDir: null,
    ociDllPath: null,
    ociDllFound: false,
    architecture,
    clientVersion: driverVersion,
    initialized: true,
    mode: 'thin',
    message: 'Driver Oracle Thin pronto. Instant Client / OCI.DLL não são necessários.',
  }
}

/** @deprecated Use ensureThinDriver — mantido para compatibilidade das rotas. */
export function initializeOracleClient(_libDir?: string, _configDir?: string): OracleClientValidation {
  return ensureThinDriver()
}

export function getOracleClientState() {
  return {
    initialized: ready,
    clientVersion: driverVersion,
    architecture: process.arch,
    nodeVersion: process.version,
    lastLibDir: null as string | null,
    lastConfigDir: null as string | null,
    mode: 'thin' as const,
  }
}

export function getOracledb() {
  return oracledb
}

export type OraclePrivilegeMode = 'normal' | 'sysdba' | 'sysoper'

/**
 * Mapeia o modo "Connect as" para a constante oficial do driver.
 * Nunca é concatenado na connectString — vai na propriedade `privilege` do
 * getConnection()/createPool() (suportada em Thin mode desde node-oracledb 6.5.1).
 * `undefined` mantém o comportamento padrão (sessão normal).
 */
export function resolvePrivilege(mode: OraclePrivilegeMode | undefined | null): number | undefined {
  if (mode === 'sysdba') return oracledb.SYSDBA
  if (mode === 'sysoper') return oracledb.SYSOPER
  return undefined
}
