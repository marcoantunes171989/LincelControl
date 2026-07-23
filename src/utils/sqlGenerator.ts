import { MODULES, MODULES_TOTAL, NFE_EXPERT_EMBEDDED_FIELD, NFE_EXPERT_PARTNER_FIELD } from '../data/modules'
import type { LicenseData, ModuleDefinition, ModuleState, NfeExpertMode, StoreData } from '../types'
import { normalizeCnpj, sanitizeSingleLine } from './formatters'

export interface SqlGenerationInput {
  store: StoreData
  license: LicenseData
  modules: ModuleState
  nfeExpertMode: NfeExpertMode
}

interface SqlFieldLine {
  field: string
  value: string
  comment: string
}

const FALLBACK_INTEGER = '0'
const INTEGER_REGEX = /^[0-9]+$/

function toSafeInteger(rawValue: string): string {
  const value = rawValue.trim()
  return INTEGER_REGEX.test(value) ? String(Number(value)) : FALLBACK_INTEGER
}

/** Resolve o valor S/N de um módulo, considerando a exclusividade do grupo NF-e Expert. */
export function resolveModuleValue(
  module: ModuleDefinition,
  modules: ModuleState,
  nfeExpertMode: NfeExpertMode,
): 'S' | 'N' {
  if (module.exclusiveGroup === 'nfe-expert') {
    if (module.field === NFE_EXPERT_EMBEDDED_FIELD) return nfeExpertMode === 'embedded' ? 'S' : 'N'
    if (module.field === NFE_EXPERT_PARTNER_FIELD) return nfeExpertMode === 'partner' ? 'S' : 'N'
  }
  return modules[module.id] ? 'S' : 'N'
}

export function countActiveModules(modules: ModuleState, nfeExpertMode: NfeExpertMode): number {
  return MODULES.filter((module) => resolveModuleValue(module, modules, nfeExpertMode) === 'S').length
}

export function countInactiveModules(modules: ModuleState, nfeExpertMode: NfeExpertMode): number {
  return MODULES_TOTAL - countActiveModules(modules, nfeExpertMode)
}

/** Conta quantos módulos de uma categoria estão resolvidos como 'S' — usado apenas para exibição (resumo). */
export function countActiveByCategory(
  modules: ModuleState,
  nfeExpertMode: NfeExpertMode,
  category: ModuleDefinition['category'],
): number {
  return MODULES.filter(
    (module) => module.category === category && resolveModuleValue(module, modules, nfeExpertMode) === 'S',
  ).length
}

/** Rótulos amigáveis dos módulos atualmente resolvidos como 'S', na ordem do catálogo — usado no resumo. */
export function getActiveModuleLabels(modules: ModuleState, nfeExpertMode: NfeExpertMode): string[] {
  return MODULES.filter((module) => resolveModuleValue(module, modules, nfeExpertMode) === 'S').map(
    (module) => module.label,
  )
}

function buildLicenseLines(license: LicenseData, store: StoreData): SqlFieldLine[] {
  return [
    { field: 'NUM_LICENCA', value: toSafeInteger(license.numLicenca), comment: 'NÚMERO DA LICENÇA' },
    { field: 'NUM_PDV', value: toSafeInteger(license.numPdv), comment: 'PDVS ATIVOS' },
    { field: 'NUM_PDV_RESERVA', value: toSafeInteger(license.numPdvReserva), comment: 'PDVS RESERVAS' },
    { field: 'NUM_PDV_BALCAO', value: toSafeInteger(license.numPdvBalcao), comment: 'PDV VENDA BALCÃO' },
    { field: 'NUM_PDV_RECEBTO', value: toSafeInteger(license.numPdvRecebto), comment: 'PDV RECEBIMENTO' },
    { field: 'NUM_DIA_VENCTO', value: toSafeInteger(license.numDiaVencto), comment: 'DIA DE VENCIMENTO DO BOLETO' },
    { field: 'NUM_CGC', value: normalizeCnpj(store.numCgc), comment: 'CNPJ DA LICENÇA' },
  ]
}

/** Gera o script SQL completo de UPDATE da TAB_LOJA a partir do estado atual do formulário. */
export function generateUpdateSql(input: SqlGenerationInput): string {
  const { store, license, modules, nfeExpertMode } = input

  const moduleLines: SqlFieldLine[] = MODULES.map((module) => ({
    field: module.field.toUpperCase(),
    value: resolveModuleValue(module, modules, nfeExpertMode),
    comment: module.comment,
  }))

  const licenseLines = buildLicenseLines(license, store)
  const allLines = [...moduleLines, ...licenseLines]

  const maxFieldLength = Math.max(...allLines.map((line) => `TAB_LOJA.${line.field}`.length))

  const setLines = allLines.map((line, index) => {
    const prefix = `TAB_LOJA.${line.field}`.padEnd(maxFieldLength)
    const isLast = index === allLines.length - 1
    const comma = isLast ? '' : ','
    return `  ${prefix} = '${line.value}'${comma} -- ${line.comment}`
  })

  const codLojaForWhere = toSafeInteger(store.codLoja)
  const descricao = sanitizeSingleLine(store.descricao).toUpperCase()
  const codLojaLabel = store.codLoja.trim() !== '' ? store.codLoja.trim() : codLojaForWhere

  const header = [
    '-- GERADOR DE UPDATE — TAB_LOJA',
    `-- Loja: ${codLojaLabel}${descricao ? ` - ${descricao}` : ''}`,
    `-- CNPJ: ${normalizeCnpj(store.numCgc)}`,
    '-- Revise as informações antes de executar no banco de dados.',
  ]

  return [
    ...header,
    '',
    'UPDATE TAB_LOJA',
    'SET',
    ...setLines,
    'WHERE',
    `  TAB_LOJA.COD_LOJA = ${codLojaForWhere};`,
  ].join('\n')
}
