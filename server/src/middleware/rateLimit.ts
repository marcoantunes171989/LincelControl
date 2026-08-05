import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

export const validationRateLimit = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: 'Muitas tentativas de validação. Aguarde e tente novamente.',
  },
})

const passwordAttempts = new Map<string, { count: number; resetAt: number }>()

export function passwordAttemptGuard(req: { ip?: string }, res: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void): void {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const current = passwordAttempts.get(key)

  if (!current || current.resetAt <= now) {
    passwordAttempts.set(key, { count: 1, resetAt: now + env.passwordAttemptWindowMs })
    next()
    return
  }

  if (current.count >= env.passwordAttemptMax) {
    res.status(429).json({
      ok: false,
      message: 'Muitas tentativas de senha. Aguarde antes de tentar novamente.',
    })
    return
  }

  current.count += 1
  passwordAttempts.set(key, current)
  next()
}

export function resetPasswordAttempts(ip?: string): void {
  if (ip) passwordAttempts.delete(ip)
}
