import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requirePermission } from '../middleware/auth.js'
import { passwordAttemptGuard, resetPasswordAttempts, validationRateLimit } from '../middleware/rateLimit.js'
import { initializeOracleClient } from '../oracle/client.js'
import { queryCatalog } from '../oracle/queryCatalog.js'
import { oracleService } from '../oracle/service.js'
import { findTnsAlias, parseTnsNames } from '../oracle/tnsParser.js'
import fs from 'node:fs/promises'
import path from 'node:path'

const configurationSchema = z.object({
  tnsAdminPath: z.string().optional().default(''),
  tnsFileName: z.string().min(1).optional().default('tnsnames.ora'),
  tnsAlias: z.string().optional().default(''),
  oracleClientLibDir: z.string().optional().default(''),
  expectedHost: z.string().optional().default(''),
  expectedPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  expectedDatabase: z.string().optional().default(''),
  username: z.string().optional().default(''),
  isEnabled: z.boolean().optional(),
})

const connectSchema = z.object({
  password: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  tnsAlias: z.string().min(1).optional(),
  oracleClientLibDir: z.string().optional(),
  tnsAdminPath: z.string().optional(),
  tnsFileName: z.string().optional(),
  expectedHost: z.string().optional(),
  expectedPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  expectedDatabase: z.string().optional(),
  mode: z.enum(['simple', 'full']).optional().default('simple'),
})

const toggleSchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  tnsAlias: z.string().min(1).optional(),
  oracleClientLibDir: z.string().optional(),
  tnsAdminPath: z.string().optional(),
  tnsFileName: z.string().optional(),
  expectedHost: z.string().optional(),
  expectedPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  expectedDatabase: z.string().optional(),
  mode: z.enum(['simple', 'full']).optional().default('simple'),
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

oracleRouter.post('/tns-import', requirePermission('oracle.configure'), validationRateLimit, async (req, res, next) => {
  try {
    const schema = z.object({
      content: z.string().min(1),
      fileName: z.string().min(1).optional().default('tnsnames.ora'),
    })
    const body = schema.parse(req.body)
    const result = await oracleService.importTnsFile(body.content, body.fileName)
    res.json({
      ok: true,
      message: `${result.aliasNames.length} alias(es) importado(s) do arquivo TNS.`,
      ...result,
      status: oracleService.getStatus(),
    })
  } catch (error) {
    next(error)
  }
})

oracleRouter.post('/tns-parse-content', requirePermission('oracle.configure'), (req, res, next) => {
  try {
    const schema = z.object({
      content: z.string().min(1),
      tnsAlias: z.string().min(1).optional(),
    })
    const body = schema.parse(req.body)
    const aliases = parseTnsNames(body.content)
    if (aliases.length === 0) {
      res.status(400).json({ ok: false, message: 'Nenhum alias TNS encontrado no conteúdo.' })
      return
    }
    const selected = body.tnsAlias
      ? aliases.find((item) => item.alias.toUpperCase() === body.tnsAlias!.trim().toUpperCase()) || null
      : aliases[0]
    res.json({ ok: true, aliases, alias: selected })
  } catch (error) {
    next(error)
  }
})

oracleRouter.post(
  '/validate-client',
  requirePermission('oracle.validate'),
  validationRateLimit,
  (_req, res, next) => {
    try {
      // Compat: Instant Client / OCI.DLL não são mais necessários (modo Thin).
      const result = initializeOracleClient()
      res.status(200).json({
        ...result,
        message: 'Modo Thin ativo — OCI.DLL não é necessária. Use Username, Password e TNS (HOST/PORT/SERVICE).',
      })
    } catch (error) {
      next(error)
    }
  },
)

function applyLogonIdentity(body: {
  username?: string
  tnsAlias?: string
  oracleClientLibDir?: string
  tnsAdminPath?: string
  tnsFileName?: string
  expectedHost?: string
  expectedPort?: number | null
  expectedDatabase?: string
}) {
  const current = oracleService.getSettings()
  const hasIdentity =
    body.username ||
    body.tnsAlias ||
    body.oracleClientLibDir !== undefined ||
    body.tnsAdminPath !== undefined ||
    body.expectedHost !== undefined ||
    body.expectedDatabase !== undefined
  if (!hasIdentity) return

  oracleService.saveConfiguration({
    tnsAdminPath: body.tnsAdminPath !== undefined ? body.tnsAdminPath : current?.tnsAdminPath,
    tnsFileName: body.tnsFileName || current?.tnsFileName,
    tnsAlias: body.tnsAlias || current?.tnsAlias || '',
    oracleClientLibDir:
      body.oracleClientLibDir !== undefined ? body.oracleClientLibDir : current?.oracleClientLibDir || '',
    expectedHost: body.expectedHost !== undefined ? body.expectedHost : current?.expectedHost,
    expectedPort: body.expectedPort !== undefined ? body.expectedPort : current?.expectedPort,
    expectedDatabase:
      body.expectedDatabase !== undefined ? body.expectedDatabase : current?.expectedDatabase,
    username: body.username || current?.username || '',
  })
}

oracleRouter.post(
  '/validate',
  requirePermission('oracle.validate'),
  validationRateLimit,
  passwordAttemptGuard,
  async (req, res, next) => {
    try {
      const body = connectSchema.parse(req.body ?? {})
      applyLogonIdentity(body)
      if (body.password) oracleService.setPassword(body.password)
      const result = await oracleService.validateConfiguration({
        password: body.password,
        includeAuth: Boolean(body.password || oracleService.hasPassword()),
        mode: body.mode ?? 'simple',
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
      applyLogonIdentity(body)
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
      if (body.enabled) applyLogonIdentity(body)
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
