import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export type OraclePermission =
  | 'oracle.configure'
  | 'oracle.validate'
  | 'oracle.connect'
  | 'oracle.disconnect'
  | 'oracle.view_status'
  | 'oracle.query_dashboard'

declare global {
  namespace Express {
    interface Request {
      actor?: string
      permissions?: Set<OraclePermission>
    }
  }
}

const ADMIN_PERMISSIONS: OraclePermission[] = [
  'oracle.configure',
  'oracle.validate',
  'oracle.connect',
  'oracle.disconnect',
  'oracle.view_status',
  'oracle.query_dashboard',
]

const VIEWER_PERMISSIONS: OraclePermission[] = ['oracle.view_status', 'oracle.query_dashboard']

function extractApiKey(req: Request): string | null {
  const header = req.header('x-admin-api-key') || req.header('x-api-key')
  if (header) return header.trim()
  const auth = req.header('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return null
}

/**
 * Autenticação por API key administrativa.
 * Em desenvolvimento, se ADMIN_API_KEY não estiver definida, libera acesso local
 * com permissões de admin para facilitar setup inicial.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const apiKey = extractApiKey(req)
  const configuredKey = env.adminApiKey

  if (!configuredKey) {
    if (env.isProduction) {
      res.status(503).json({
        ok: false,
        message: 'ADMIN_API_KEY não configurada. Defina a chave antes de expor a API em produção.',
      })
      return
    }
    req.actor = req.header('x-actor') || 'local-dev-admin'
    req.permissions = new Set(ADMIN_PERMISSIONS)
    next()
    return
  }

  if (!apiKey || apiKey !== configuredKey) {
    res.status(401).json({ ok: false, message: 'Não autorizado.' })
    return
  }

  const role = (req.header('x-role') || 'admin').toLowerCase()
  req.actor = req.header('x-actor') || 'admin'
  req.permissions = new Set(role === 'viewer' ? VIEWER_PERMISSIONS : ADMIN_PERMISSIONS)
  next()
}

export function requirePermission(...required: OraclePermission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permissions = req.permissions ?? new Set<OraclePermission>()
    const missing = required.filter((item) => !permissions.has(item))
    if (missing.length > 0) {
      res.status(403).json({
        ok: false,
        message: 'Permissão insuficiente.',
        required: missing,
      })
      return
    }
    next()
  }
}
