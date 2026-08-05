import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

async function loadService(dataDir: string) {
  vi.resetModules()
  process.env.DATA_DIR = dataDir
  process.env.ADMIN_API_KEY = ''
  process.env.NODE_ENV = 'test'
  const db = await import('../src/db/settingsStore.js')
  db.initializeDatabase()
  const serviceModule = await import('../src/oracle/service.js')
  return { db, oracleService: serviceModule.oracleService }
}

describe('oracleService behaviors (sem Oracle real)', () => {
  beforeEach(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'licen-oracle-'))
    tempDirs.push(dir)
  })

  afterEach(async () => {
    try {
      const { closeDatabase } = await import('../src/db/settingsStore.js')
      closeDatabase()
    } catch {
      /* ignore */
    }
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('marca não configurado sem settings', async () => {
    const dataDir = tempDirs[0]
    const { oracleService } = await loadService(dataDir)
    const status = oracleService.getStatus()
    expect(status.configured).toBe(false)
    expect(status.status).toBe('not_configured')
  })

  it('persiste configuração sem senha', async () => {
    const dataDir = tempDirs[0]
    const { oracleService } = await loadService(dataDir)
    const saved = oracleService.saveConfiguration({
      tnsAdminPath: '\\\\SERVIDOR\\Oracle\\Network\\Admin',
      tnsFileName: 'tnsnames.ora',
      tnsAlias: 'CLIENTE_PRODUCAO',
      oracleClientLibDir: 'C:\\Oracle\\instantclient_19_25',
      expectedHost: '192.168.0.10',
      expectedPort: 1521,
      expectedDatabase: 'ORCL',
      username: 'USUARIO_CONSULTA',
    })
    expect(saved.username).toBe('USUARIO_CONSULTA')
    expect(oracleService.getSettings()?.tnsAlias).toBe('CLIENTE_PRODUCAO')
    expect(oracleService.hasPassword()).toBe(false)
    expect(JSON.stringify(saved)).not.toMatch(/password|senha/i)
  })

  it('falha ao listar aliases de arquivo inexistente', async () => {
    const dataDir = tempDirs[0]
    const { oracleService } = await loadService(dataDir)
    await expect(oracleService.listAliases(path.join(dataDir, 'missing'), 'tnsnames.ora')).rejects.toBeTruthy()
  })

  it('lista aliases de um tnsnames válido', async () => {
    const dataDir = tempDirs[0]
    const tnsDir = path.join(dataDir, 'network')
    fs.mkdirSync(tnsDir, { recursive: true })
    fs.writeFileSync(
      path.join(tnsDir, 'tnsnames.ora'),
      `
TEST_ALIAS =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = 127.0.0.1)(PORT = 1521))
    (CONNECT_DATA = (SERVICE_NAME = ORCL))
  )
`,
      'utf8',
    )

    const { oracleService } = await loadService(dataDir)
    const result = await oracleService.listAliases(tnsDir, 'tnsnames.ora')
    expect(result.aliases).toContain('TEST_ALIAS')
  })

  it('salva TNS_ADMIN, valida arquivo e carrega aliases', async () => {
    const dataDir = tempDirs[0]
    const tnsDir = path.join(dataDir, 'network', 'admin')
    fs.mkdirSync(tnsDir, { recursive: true })
    fs.writeFileSync(
      path.join(tnsDir, 'tnsnames.ora'),
      `
ORCL =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = 172.26.3.2)(PORT = 1521))
    (CONNECT_DATA = (SERVICE_NAME = orcl))
  )
`,
      'utf8',
    )

    const { oracleService } = await loadService(dataDir)
    const result = await oracleService.saveTnsAdmin({
      tnsAdminPath: tnsDir,
      tnsFileName: 'tnsnames.ora',
    })

    expect(result.aliases).toContain('ORCL')
    expect(result.settings.tnsAdminPath).toBe(tnsDir)
    expect(result.settings.expectedHost).toBe('172.26.3.2')
    expect(result.settings.expectedDatabase).toBe('orcl')
    expect(process.env.TNS_ADMIN).toBe(tnsDir)
  })

  it('consulta com pool desconectado falha', async () => {
    const dataDir = tempDirs[0]
    const { oracleService } = await loadService(dataDir)
    await expect(oracleService.executeCatalogQuery('connection-info')).rejects.toThrow(/desconectado/i)
  })

  it('desconectar duas vezes não quebra', async () => {
    const dataDir = tempDirs[0]
    const { oracleService } = await loadService(dataDir)
    await oracleService.disconnectOraclePool()
    await oracleService.disconnectOraclePool()
    expect(oracleService.getStatus().connected).toBe(false)
  })

  it('exige senha para conectar', async () => {
    const dataDir = tempDirs[0]
    const { oracleService } = await loadService(dataDir)
    oracleService.saveConfiguration({
      tnsAdminPath: '\\\\SERVIDOR\\Oracle\\Network\\Admin',
      tnsFileName: 'tnsnames.ora',
      tnsAlias: 'CLIENTE_PRODUCAO',
      oracleClientLibDir: 'C:\\Oracle\\instantclient_19_25',
      expectedHost: '192.168.0.10',
      expectedPort: 1521,
      expectedDatabase: 'ORCL',
      username: 'USUARIO_CONSULTA',
    })
    await expect(oracleService.connectOraclePool()).rejects.toThrow(/senha/i)
    expect(oracleService.getStatus().status).toBe('password_required')
  })
})
