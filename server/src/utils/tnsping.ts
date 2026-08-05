import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'

export interface TnsPingResult {
  available: boolean
  ok: boolean
  exitCode: number | null
  durationMs: number
  summary: string
  error: string | null
  executable: string | null
}

function resolveTnspingExecutable(clientLibDir?: string): string | null {
  const candidates = [
    env.oracleTnspingPath,
    clientLibDir ? path.join(clientLibDir, 'tnsping.exe') : '',
    clientLibDir ? path.join(clientLibDir, 'tnsping') : '',
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

export function runTnsPing(alias: string, clientLibDir?: string, timeoutMs = env.oracleTnspingTimeoutMs): Promise<TnsPingResult> {
  const executable = resolveTnspingExecutable(clientLibDir)
  if (!executable) {
    return Promise.resolve({
      available: false,
      ok: false,
      exitCode: null,
      durationMs: 0,
      summary: 'tnsping não encontrado. Etapa ignorada.',
      error: null,
      executable: null,
    })
  }

  const started = Date.now()
  return new Promise((resolve) => {
    const child = spawn(executable, [alias], {
      windowsHide: true,
      env: {
        ...process.env,
        TNS_ADMIN: process.env.TNS_ADMIN,
      },
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (payload: Omit<TnsPingResult, 'available' | 'executable' | 'durationMs'>) => {
      if (settled) return
      settled = true
      resolve({
        available: true,
        executable,
        durationMs: Date.now() - started,
        ...payload,
      })
    }

    const timer = setTimeout(() => {
      child.kill()
      finish({
        ok: false,
        exitCode: null,
        summary: `Timeout do tnsping após ${timeoutMs}ms.`,
        error: 'TNSPING_TIMEOUT',
      })
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      finish({
        ok: false,
        exitCode: null,
        summary: 'Falha ao executar tnsping.',
        error: error.message,
      })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      const combined = `${stdout}\n${stderr}`.trim()
      const ok = code === 0 && /OK\s*\(/i.test(combined)
      const summaryLine =
        combined
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(-3)
          .join(' | ') || 'Sem saída do tnsping.'

      finish({
        ok,
        exitCode: code,
        summary: summaryLine.slice(0, 500),
        error: ok ? null : stderr.trim() || null,
      })
    })
  })
}
