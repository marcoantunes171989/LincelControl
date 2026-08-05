import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { oracleRouter } from './routes/oracle.js'

export function createApp() {
  const app = express()

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  )
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((item) => item.trim()),
      credentials: true,
    }),
  )
  // TNS importado pelo navegador pode ultrapassar 64kb.
  app.use(express.json({ limit: '2mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({
      service: 'licencontrol-api',
      status: 'ok',
      checkedAt: new Date().toISOString(),
    })
  })

  app.use('/api/oracle', oracleRouter)

  app.use(errorHandler)
  return app
}
