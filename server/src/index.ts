import { createApp } from './app.js'
import { env } from './config/env.js'
import { closeDatabase, initializeDatabase } from './db/settingsStore.js'
import { oracleService } from './oracle/service.js'
import { logger } from './utils/logger.js'

async function main() {
  initializeDatabase()

  try {
    await oracleService.bootstrap()
  } catch (error) {
    logger.error('Bootstrap Oracle falhou sem interromper a API', {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  const app = createApp()
  const server = app.listen(env.port, env.host, () => {
    logger.info('API LicenControl iniciada', {
      host: env.host,
      port: env.port,
      corsOrigin: env.corsOrigin,
      nodeEnv: env.nodeEnv,
    })
  })

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info(`Encerrando API (${signal})`)

    try {
      await oracleService.shutdown()
    } catch (error) {
      logger.warn('Falha ao encerrar pool Oracle no shutdown', {
        message: error instanceof Error ? error.message : String(error),
      })
    }

    closeDatabase()

    server.close(() => {
      logger.info('Servidor HTTP encerrado')
      process.exit(0)
    })

    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  process.on('uncaughtException', (error) => {
    logger.error('uncaughtException', { message: error.message, stack: error.stack })
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    })
  })
}

main().catch((error) => {
  logger.error('Falha fatal ao iniciar API', {
    message: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
})
