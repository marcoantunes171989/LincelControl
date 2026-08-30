import { describe, expect, it } from 'vitest'
import {
  LICENSE_INTEGER_FIELDS,
  MODULE_FIELDS,
  MODULE_FIELDS_TOTAL,
  NFE_EXPERT_EMBEDDED_ID,
  NFE_EXPERT_PARTNER_ID,
  NUM_CGC_COLUMN,
  isKnownModuleId,
  resolveModuleValue,
} from '../src/oracle/licenseFields.js'
// Importa o catálogo real do frontend (fora do rootDir do tsc, mas os testes
// são excluídos do build — ver server/tsconfig.json). É o que garante que o
// backend nunca fica com uma whitelist divergente da tela do Gerador SQL.
import { MODULES, MODULES_TOTAL } from '../../src/data/modules'
import { generateUpdateSql } from '../../src/utils/sqlGenerator'

describe('licenseFields catalog (whitelist da atualização de licença)', () => {
  it('espelha exatamente os módulos do frontend (id + coluna)', () => {
    expect(MODULE_FIELDS_TOTAL).toBe(MODULES_TOTAL)
    const backendById = new Map(MODULE_FIELDS.map((field) => [field.id, field.column]))
    expect(backendById.size).toBe(MODULES.length)
    for (const module of MODULES) {
      expect(backendById.get(module.id)).toBe(module.field.toUpperCase())
    }
  })

  it('mantém a exclusividade do grupo NF-e Expert', () => {
    const embedded = MODULE_FIELDS.find((field) => field.id === NFE_EXPERT_EMBEDDED_ID)!
    const partner = MODULE_FIELDS.find((field) => field.id === NFE_EXPERT_PARTNER_ID)!

    expect(resolveModuleValue(embedded, {}, 'embedded')).toBe('S')
    expect(resolveModuleValue(partner, {}, 'embedded')).toBe('N')
    expect(resolveModuleValue(embedded, {}, 'partner')).toBe('N')
    expect(resolveModuleValue(partner, {}, 'partner')).toBe('S')
    expect(resolveModuleValue(embedded, {}, 'nenhuma')).toBe('N')
    expect(resolveModuleValue(partner, {}, 'nenhuma')).toBe('N')
  })

  it('resolve módulos normais a partir do estado enviado', () => {
    const field = MODULE_FIELDS.find((item) => item.id === 'MOD_VENDAS')!
    expect(resolveModuleValue(field, { MOD_VENDAS: true }, 'nenhuma')).toBe('S')
    expect(resolveModuleValue(field, { MOD_VENDAS: false }, 'nenhuma')).toBe('N')
    expect(resolveModuleValue(field, {}, 'nenhuma')).toBe('N')
  })

  it('rejeita id de módulo desconhecido e aceita os do catálogo', () => {
    expect(isKnownModuleId('DROP_TABLE_TAB_LOJA')).toBe(false)
    expect(isKnownModuleId("MOD_MOVIMENTO'; DROP TABLE TAB_LOJA; --")).toBe(false)
    expect(isKnownModuleId('MOD_MOVIMENTO')).toBe(true)
  })

  it('campos de licença batem com o SQL gerado pelo Gerador SQL (buildLicenseLines)', () => {
    const store = { codLoja: '1', numCgc: '02274225000161', descricao: 'Loja Teste' }
    const license = {
      numLicenca: '9090',
      numDiaVencto: '5',
      numPdv: '100',
      numPdvBalcao: '1',
      numPdvReserva: '0',
      numPdvRecebto: '1',
    }
    const modules: Record<string, boolean> = {}
    for (const module of MODULES) {
      if (!module.exclusiveGroup) modules[module.id] = true
    }

    const sql = generateUpdateSql({ store, license, modules, nfeExpertMode: 'embedded' })

    for (const field of LICENSE_INTEGER_FIELDS) {
      const value = license[field.key as keyof typeof license]
      expect(sql).toMatch(new RegExp(`${field.column}\\s*=\\s*'${value}'`))
    }
    expect(sql).toMatch(new RegExp(`${NUM_CGC_COLUMN}\\s*=\\s*'02274225000161'`))
  })
})
