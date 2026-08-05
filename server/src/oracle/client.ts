import fs from 'node:fs'
import path from 'node:path'
import oracledb from 'oracledb'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { translateOracleError } from './errors.js'

let initialized = false
let clientVersion: string | null = null
let lastLibDir: string | null = null
let lastConfigDir: string | null = null

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
  code?: string | null
  technicalMessage?: string
}

function resolveOciDll(libDir: string): { path: string; found: boolean } {
  const candidates = [path.join(libDir, 'oci.dll'), path.join(libDir, 'OCI.DLL'), path.join(libDir, 'libclntsh.so')]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { path: candidate, found: true }
    }
  }
  return { path: candidates[0], found: false }
}

export function getOracleClientState() {
  return {
    initialized,
    clientVersion,
    architecture: process.arch,
    nodeVersion: process.version,
    lastLibDir,
    lastConfigDir,
  }
}

/**
 * Inicialização singleton do Oracle Client (modo Thick).
 * Segura para ser chamada múltiplas vezes — só inicializa uma vez por processo,
 * salvo se libDir/configDir mudarem antes da primeira conexão bem-sucedida.
 */
export function initializeOracleClient(libDir?: string, configDir?: string): OracleClientValidation {
  const resolvedLibDir = (libDir || env.oracleClientLibDir || '').trim()
  const resolvedConfigDir = (configDir || env.oracleTnsAdmin || '').trim() || null
  const architecture = process.arch

  if (!resolvedLibDir) {
    return {
      ok: false,
      libDir: '',
      configDir: resolvedConfigDir,
      ociDllPath: null,
      ociDllFound: false,
      architecture,
      clientVersion,
      initialized,
      message: 'Caminho do Oracle Client não informado.',
    }
  }

  if (!fs.existsSync(resolvedLibDir)) {
    return {
      ok: false,
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      ociDllPath: null,
      ociDllFound: false,
      architecture,
      clientVersion,
      initialized,
      message: `Diretório do Oracle Client não existe: ${resolvedLibDir}`,
    }
  }

  const oci = resolveOciDll(resolvedLibDir)
  if (!oci.found) {
    return {
      ok: false,
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      ociDllPath: oci.path,
      ociDllFound: false,
      architecture,
      clientVersion,
      initialized,
      message: `OCI.DLL não encontrada em ${resolvedLibDir}.`,
      code: 'DPI-1047',
    }
  }

  if (initialized && lastLibDir === resolvedLibDir && lastConfigDir === resolvedConfigDir) {
    return {
      ok: true,
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      ociDllPath: oci.path,
      ociDllFound: true,
      architecture,
      clientVersion,
      initialized: true,
      message: 'Oracle Client já inicializado.',
    }
  }

  if (initialized && (lastLibDir !== resolvedLibDir || lastConfigDir !== resolvedConfigDir)) {
    return {
      ok: false,
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      ociDllPath: oci.path,
      ociDllFound: true,
      architecture,
      clientVersion,
      initialized: true,
      message:
        'Oracle Client já foi inicializado neste processo com outro caminho. Reinicie a API para alterar libDir/configDir.',
    }
  }

  try {
    oracledb.initOracleClient({
      libDir: resolvedLibDir,
      ...(resolvedConfigDir ? { configDir: resolvedConfigDir } : {}),
    })

    initialized = true
    lastLibDir = resolvedLibDir
    lastConfigDir = resolvedConfigDir

    try {
      const version = oracledb.oracleClientVersionString
      clientVersion = typeof version === 'string' ? version : version ? String(version) : null
    } catch {
      clientVersion = null
    }

    if (resolvedConfigDir) {
      process.env.TNS_ADMIN = resolvedConfigDir
    }

    logger.info('Oracle Client inicializado', {
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      clientVersion,
      architecture,
    })

    return {
      ok: true,
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      ociDllPath: oci.path,
      ociDllFound: true,
      architecture,
      clientVersion,
      initialized: true,
      message: 'Oracle Client carregado com sucesso.',
    }
  } catch (error) {
    const translated = translateOracleError(error, 'oracle-client')
    logger.error('Falha ao inicializar Oracle Client', translated)
    return {
      ok: false,
      libDir: resolvedLibDir,
      configDir: resolvedConfigDir,
      ociDllPath: oci.path,
      ociDllFound: oci.found,
      architecture,
      clientVersion,
      initialized: false,
      message: translated.message,
      code: translated.code,
      technicalMessage: translated.technicalMessage,
    }
  }
}

export function getOracledb() {
  return oracledb
}
