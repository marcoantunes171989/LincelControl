import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Payload inválido.',
      details: error.flatten(),
    })
    return
  }

  const err = error as {
    statusCode?: number
    code?: string
    message?: string
    technicalMessage?: string
    stages?: unknown
    expected?: unknown
    found?: unknown
  }

  const statusCode = err.statusCode && Number.isFinite(err.statusCode) ? err.statusCode : 500
  const message = err.message || 'Erro interno do servidor.'

  logger.error('Erro na API Oracle', {
    statusCode,
    code: err.code,
    message,
    technicalMessage: err.technicalMessage,
  })

  res.status(statusCode).json({
    ok: false,
    code: err.code ?? null,
    message,
    ...(err.expected !== undefined ? { expected: err.expected } : {}),
    ...(err.found !== undefined ? { found: err.found } : {}),
    ...(err.stages ? { stages: err.stages } : {}),
    ...(env.isProduction ? {} : { technicalMessage: err.technicalMessage }),
  })
}
