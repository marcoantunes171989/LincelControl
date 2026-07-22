import { describe, expect, it } from 'vitest'
import { buildModuleState } from '../data/initialValues'
import { MODULES, MODULES_TOTAL, NFE_EXPERT_EMBEDDED_FIELD, NFE_EXPERT_PARTNER_FIELD } from '../data/modules'
import type { LicenseData, StoreData } from '../types'
import { buildSqlFileName } from '../utils/downloadSql'
import { generateUpdateSql } from '../utils/sqlGenerator'

const BASE_STORE: StoreData = {
  codLoja: '1',
  numCgc: '02274225000161',
  descricao: 'JACI SUPERMERCADOS LTDA',
}

const BASE_LICENSE: LicenseData = {
  numLicenca: '9090',
  numDiaVencto: '5',
  numPdv: '100',
  numPdvBalcao: '1',
  numPdvReserva: '0',
  numPdvRecebto: '1',
}

function extractFieldValues(sql: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /TAB_LOJA\.(\S+)\s*=\s*'([^']*)'/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(sql)) !== null) {
    result[match[1]] = match[2]
  }
  return result
}

describe('catálogo de módulos', () => {
  it('possui exatamente 55 módulos', () => {
    expect(MODULES_TOTAL).toBe(55)
    expect(MODULES).toHaveLength(55)
  })

  it('não possui campos duplicados', () => {
    const fields = MODULES.map((module) => module.field)
    expect(new Set(fields).size).toBe(fields.length)
  })

  it('não possui ids duplicados', () => {
    const ids = MODULES.map((module) => module.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('generateUpdateSql', () => {
  it('gera "S" para módulo selecionado e "N" para módulo desmarcado', () => {
    const modules = buildModuleState(() => true)
    modules.MOD_BLING = false

    const sql = generateUpdateSql({ store: BASE_STORE, license: BASE_LICENSE, modules, nfeExpertMode: 'nenhuma' })
    const values = extractFieldValues(sql)

    expect(values.MOD_MOVIMENTO).toBe('S')
    expect(values.MOD_BLING).toBe('N')
  })

  it('inclui todos os 55 módulos no SET', () => {
    const modules = buildModuleState()
    const sql = generateUpdateSql({ store: BASE_STORE, license: BASE_LICENSE, modules, nfeExpertMode: 'nenhuma' })
    const values = extractFieldValues(sql)

    for (const module of MODULES) {
      expect(values[module.field]).toBeDefined()
    }
  })

  it('modalidade Embedded gera Mod_Gestor_Doc_Fisc = S e MOD_NFE = N', () => {
    const modules = buildModuleState()
    const sql = generateUpdateSql({ store: BASE_STORE, license: BASE_LICENSE, modules, nfeExpertMode: 'embedded' })
    const values = extractFieldValues(sql)

    expect(values[NFE_EXPERT_EMBEDDED_FIELD]).toBe('S')
    expect(values[NFE_EXPERT_PARTNER_FIELD]).toBe('N')
  })

  it('modalidade Partner gera Mod_Gestor_Doc_Fisc = N e MOD_NFE = S', () => {
    const modules = buildModuleState()
    const sql = generateUpdateSql({ store: BASE_STORE, license: BASE_LICENSE, modules, nfeExpertMode: 'partner' })
    const values = extractFieldValues(sql)

    expect(values[NFE_EXPERT_EMBEDDED_FIELD]).toBe('N')
    expect(values[NFE_EXPERT_PARTNER_FIELD]).toBe('S')
  })

  it('modalidade Nenhuma gera os dois campos como N', () => {
    const modules = buildModuleState()
    const sql = generateUpdateSql({ store: BASE_STORE, license: BASE_LICENSE, modules, nfeExpertMode: 'nenhuma' })
    const values = extractFieldValues(sql)

    expect(values[NFE_EXPERT_EMBEDDED_FIELD]).toBe('N')
    expect(values[NFE_EXPERT_PARTNER_FIELD]).toBe('N')
  })

  it('nunca gera os dois campos NF-e Expert como S simultaneamente', () => {
    const modules = buildModuleState()
    for (const mode of ['nenhuma', 'embedded', 'partner'] as const) {
      const sql = generateUpdateSql({ store: BASE_STORE, license: BASE_LICENSE, modules, nfeExpertMode: mode })
      const values = extractFieldValues(sql)
      const bothActive = values[NFE_EXPERT_EMBEDDED_FIELD] === 'S' && values[NFE_EXPERT_PARTNER_FIELD] === 'S'
      expect(bothActive).toBe(false)
    }
  })

  it('normaliza o CNPJ formatado com máscara para dígitos', () => {
    const store: StoreData = { ...BASE_STORE, numCgc: '02.274.225/0001-61' }
    const sql = generateUpdateSql({
      store,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    const values = extractFieldValues(sql)
    expect(values.NUM_CGC).toBe('02274225000161')
  })

  it('mantém os zeros à esquerda do CNPJ', () => {
    const store: StoreData = { ...BASE_STORE, numCgc: '00274225000161' }
    const sql = generateUpdateSql({
      store,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    const values = extractFieldValues(sql)
    expect(values.NUM_CGC).toBe('00274225000161')
  })

  it('utiliza o código da loja corretamente no WHERE', () => {
    const store: StoreData = { ...BASE_STORE, codLoja: '42' }
    const sql = generateUpdateSql({
      store,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    expect(sql).toMatch(/WHERE\s+TAB_LOJA\.COD_LOJA = 42;/)
  })

  it('o último campo antes do WHERE não possui vírgula', () => {
    const sql = generateUpdateSql({
      store: BASE_STORE,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    const setBlock = sql.split('WHERE')[0].trim()
    const lastLine = setBlock.split('\n').at(-1) ?? ''
    expect(lastLine.includes(',')).toBe(false)
  })

  it('o SQL termina com ponto e vírgula', () => {
    const sql = generateUpdateSql({
      store: BASE_STORE,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    expect(sql.trim().endsWith(';')).toBe(true)
  })

  it('o campo descrição não aparece no SET', () => {
    const store: StoreData = { ...BASE_STORE, descricao: 'DESCRICAO_UNICA_TESTE' }
    const sql = generateUpdateSql({
      store,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    const setBlock = sql.split('SET')[1]?.split('WHERE')[0] ?? ''
    expect(setBlock.includes('DESCRICAO_UNICA_TESTE')).toBe(false)
  })

  it('remove quebras de linha da descrição no comentário do cabeçalho', () => {
    const store: StoreData = { ...BASE_STORE, descricao: 'Linha 1\nLinha 2\r\nLinha 3' }
    const sql = generateUpdateSql({
      store,
      license: BASE_LICENSE,
      modules: buildModuleState(),
      nfeExpertMode: 'nenhuma',
    })
    const headerLine = sql.split('\n').find((line) => line.startsWith('-- Loja:'))
    expect(headerLine).toContain('Linha 1 Linha 2 Linha 3')
  })
})

describe('buildSqlFileName', () => {
  it('gera o nome do arquivo corretamente', () => {
    expect(buildSqlFileName(BASE_STORE)).toBe('update_tab_loja_1_02274225000161.sql')
  })
})
