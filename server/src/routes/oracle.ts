import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requirePermission } from '../middleware/auth.js'
import { passwordAttemptGuard, resetPasswordAttempts, validationRateLimit } from '../middleware/rateLimit.js'
import { initializeOracleClient } from '../oracle/client.js'
import { queryCatalog } from '../oracle/queryCatalog.js'
import { oracleService } from '../oracle/service.js'
import { findTnsAlias } from '../oracle/tnsParser.js'
import fs from 'node:fs/promises'
import path from 'node:path'

const configurationSchema = z.object({
  tnsAdminPath: z.string().min(1),
  tnsFileName: z.string().min(1).optional().default('tnsnames.ora'),
  tnsAlias: z.string().min(1),
  oracleClientLibDir: z.string().min(1),
  expectedHost: z.string().min(1),
  expectedPort: z.coerce.number().int().min(1).max(65535),
  expectedDatabase: z.string().min(1),
  username: z.string().min(1),
  isEnabled: z.boolean().optional(),
})

const connectSchema = z.object({
  password: z.string().min(1).optional(),
})

const toggleSchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1).optional(),
})

const querySchema = z.object({
  queryId: z.string().min(1),
  binds: z.record(z.unknown()).optional(),
})

const aliasesSchema = z.object({
  tnsAdminPath: z.string().min(1).optional(),
  tnsFileName: z.string().min(1).optional(),
})

export const oracleRouter = Router()

oracleRouter.use(authenticate)

oracleRouter.get('/health', requirePermission('oracle.view_status'), (_req, res) => {
  res.json(oracleService.getHealth())
})

oracleRouter.get('/status', requirePermission('oracle.view_status'), (_req, res) => {
  res.json(oracleService.getStatus())
})

oracleRouter.get('/configuration', requirePermission('oracle.configure'), (_req, res) => {
  const settings = oracleService.getSettings()
  res.json({
    ok: true,
    configuration: settings,
  })
})

oracleRouter.post('/configuration', requirePermission('oracle.configure'), (req, res, next) => {
  try {
    const payload = configurationSchema.parse(req.body)
    const saved = oracleService.saveConfiguration(payload)
    res.json({ ok: true, configuration: saved })
  } catch (error) {
    next(error)
  }
})

oracleRouter.get('/tns-aliases', requirePermission('oracle.configure'), async (req, res, next) => {
  try {
    const query = aliasesSchema.parse(req.query)
    const result = await oracleService.listAliases(query.tnsAdminPath, query.tnsFileName)
    res.json({ ok: true, ...result })
  } catch (error) {
    next(error)
  }
})

oracleRouter.post('/tns-aliases', requirePermission('oracle.configure'), async (req, res, next) => {
  try {
    const body = aliasesSchema.parse(req.body ?? {})
    const result = await oracleService.listAliases(body.tnsAdminPath, body.tnsFileName)
    res.json({ ok: true, ...result })
  } catch (error) {
    next(error)
  }
})

oracleRouter.post('/tns-parse', requirePermission('oracle.configure'), async (req, res, next) => {
  try {
    const schema = z.object({
      tnsAdminPath: z.string().min(1),
      tnsFileName: z.string().min(1).default('tnsnames.ora'),
      tnsAlias: z.string().min(1),
    })
    const body = schema.parse(req.body)
    const filePath = path.join(body.tnsAdminPath, body.tnsFileName)
    const content = await fs.readFile(filePath, 'utf8')
    const alias = findTnsAlias(content, body.tnsAlias)
    if (!alias) {
      res.status(404).json({ ok: false, message: `Alias ${body.tnsAlias} não encontrado.` })
      return
    }
    res.json({ ok: true, alias })
  } catch (error) {
    next(error)
  }
})

oracleRouter.post(
  '/validate-client',
  requirePermission('oracle.validate'),
  validationRateLimit,
  (req, res, next) => {
    try {
      const schema = z.object({
        oracleClientLibDir: z.string().min(1),
        tnsAdminPath: z.string().optional(),
      })
      const body = schema.parse(req.body)
      const result = initializeOracleClient(body.oracleClientLibDir, body.tnsAdminPath)
      res.status(result.ok ? 200 : 400).json(result)
    } catch (error) {
      next(error)
    }
  },
)

oracleRouter.post(
  '/validate',
  requirePermission('oracle.validate'),
  validationRateLimit,
  passwordAttemptGuard,
  async (req, res, next) => {
    try {
      const body = connectSchema.parse(req.body ?? {})
      if (body.password) oracleService.setPassword(body.password)
      const result = await oracleService.validateConfiguration({
        password: body.password,
        includeAuth: Boolean(body.password || oracleService.hasPassword()),
        actor: req.actor,
      })
      if (result.ok) resetPasswordAttempts(req.ip)
      res.status(result.ok ? 200 : 400).json({
        ok: result.ok,
        stages: result.stages,
        alias: result.alias,
        status: oracleService.getStatus(),
      })
    } catch (error) {
      next(error)
    }
  },
)

oracleRouter.post(
  '/connect',
  requirePermission('oracle.connect'),
  validationRateLimit,
  passwordAttemptGuard,
  async (req, res, next) => {
    try {
      const body = connectSchema.parse(req.body ?? {})
      const status = await oracleService.connectOraclePool({
        password: body.password,
        actor: req.actor,
      })
      resetPasswordAttempts(req.ip)
      res.json({ ok: true, status })
    } catch (error) {
      next(error)
    }
  },
)

oracleRouter.post('/disconnect', requirePermission('oracle.disconnect'), async (req, res, next) => {
  try {
    const status = await oracleService.disconnectOraclePool({ actor: req.actor })
    res.json({ ok: true, status })
  } catch (error) {
    next(error)
  }
})

oracleRouter.post(
  '/toggle',
  requirePermission('oracle.connect', 'oracle.disconnect'),
  validationRateLimit,
  passwordAttemptGuard,
  async (req, res, next) => {
    try {
      const body = toggleSchema.parse(req.body)
      if (body.enabled && body.password) oracleService.setPassword(body.password)
      const status = await oracleService.toggle(body.enabled, body.password, req.actor)
      if (body.enabled) resetPasswordAttempts(req.ip)
      res.json({ ok: true, status })
    } catch (error) {
      next(error)
    }
  },
)

oracleRouter.get('/queries', requirePermission('oracle.query_dashboard'), (_req, res) => {
  const items = Object.entries(queryCatalog).map(([id, query]) => ({
    id,
    description: query.description,
    allowedBinds: query.allowedBinds,
  }))
  res.json({ ok: true, queries: items })
})

oracleRouter.post('/query', requirePermission('oracle.query_dashboard'), async (req, res, next) => {
  try {
    const body = querySchema.parse(req.body)
    const result = await oracleService.executeCatalogQuery(body.queryId, body.binds, req.actor)
    res.json(result)
  } catch (error) {
    next(error)
  }
})
