/**
 * Catálogo interno (whitelist) das colunas da TAB_LOJA que a operação de
 * aplicação de licença tem permissão de alterar.
 *
 * Espelha deliberadamente `src/data/modules.ts` (módulos/integrações) e os
 * campos de licença montados em `src/utils/sqlGenerator.ts` no frontend —
 * `server/tests/licenseFields.test.ts` importa ambos os lados e falha se
 * divergirem, então este arquivo é a fonte de verdade que o backend usa
 * para nunca aceitar nome de coluna vindo do navegador.
 *
 * Nenhum nome de coluna chega até aqui vindo da requisição: o payload só
 * pode referenciar os `id`s abaixo (para módulos) ou as chaves fixas de
 * licença; qualquer outra chave é rejeitada antes de montar o SQL.
 */

export type NfeExpertMode = 'nenhuma' | 'embedded' | 'partner'

export const NFE_EXPERT_EMBEDDED_ID = 'mod_gestor_doc_fisc'
export const NFE_EXPERT_PARTNER_ID = 'MOD_NFE'

export interface ModuleFieldDefinition {
  /** Chave usada no payload (`modules[id]`) — igual a `ModuleDefinition.id` no frontend. */
  id: string
  /** Nome real da coluna na TAB_LOJA (maiúsculas, como o gerador de SQL sempre escreve). */
  column: string
  exclusiveGroup?: 'nfe-expert'
}

/**
 * Os 62 campos de módulo/integração da TAB_LOJA.
 * Mantido em paridade 1:1 com MODULES em src/data/modules.ts (mesma ordem e ids).
 */
export const MODULE_FIELDS: ModuleFieldDefinition[] = [
  { id: 'MOD_MOVIMENTO', column: 'MOD_MOVIMENTO' },
  { id: 'MOD_COMPRAS', column: 'MOD_COMPRAS' },
  { id: 'MOD_VENDAS', column: 'MOD_VENDAS' },
  { id: 'MOD_ONLINE', column: 'MOD_ONLINE' },
  { id: 'MOD_CN', column: 'MOD_CN' },
  { id: 'MOD_INCOLETA', column: 'MOD_INCOLETA' },
  { id: 'MOD_GI', column: 'MOD_GI' },
  { id: 'MOD_FINANCEIRO', column: 'MOD_FINANCEIRO' },
  { id: 'MOD_FISCAL', column: 'MOD_FISCAL' },
  { id: 'MOD_CONTABIL', column: 'MOD_CONTABIL' },
  { id: 'MOD_MOBILE', column: 'MOD_MOBILE' },
  { id: 'MOD_SPED_FISCAL', column: 'MOD_SPED_FISCAL' },
  { id: 'MOD_SPED_CTB', column: 'MOD_SPED_CTB' },
  { id: 'MOD_COTACAO_WEB', column: 'MOD_COTACAO_WEB' },
  { id: 'MOD_DISPLAY', column: 'MOD_DISPLAY' },
  { id: 'MOD_DASHBOARD', column: 'MOD_DASHBOARD' },
  { id: 'MOD_AGENTE_NF', column: 'MOD_AGENTE_NF' },
  { id: 'MOD_OCTOPO', column: 'MOD_OCTOPO' },
  { id: NFE_EXPERT_EMBEDDED_ID, column: 'MOD_GESTOR_DOC_FISC', exclusiveGroup: 'nfe-expert' },
  { id: NFE_EXPERT_PARTNER_ID, column: 'MOD_NFE', exclusiveGroup: 'nfe-expert' },
  { id: 'MOD_AGENTE_IA', column: 'MOD_AGENTE_IA' },
  { id: 'MOD_ANALYTICS', column: 'MOD_ANALYTICS' },
  { id: 'MOD_CARTAZ', column: 'MOD_CARTAZ' },
  { id: 'MOD_ACORDO', column: 'MOD_ACORDO' },
  { id: 'MOD_RH', column: 'MOD_RH' },
  { id: 'MOD_MIX_FISCAL', column: 'MOD_MIX_FISCAL' },
  { id: 'MOD_SITEMERCADO', column: 'MOD_SITEMERCADO' },
  { id: 'MOD_VELOXCODE', column: 'MOD_VELOXCODE' },
  { id: 'MOD_SCANNTECH', column: 'MOD_SCANNTECH' },
  { id: 'MOD_BENASSI', column: 'MOD_BENASSI' },
  { id: 'MOD_BIGDATA', column: 'MOD_BIGDATA' },
  { id: 'MOD_SUPRASYS', column: 'MOD_SUPRASYS' },
  { id: 'MOD_KIKKER', column: 'MOD_KIKKER' },
  { id: 'MOD_PRICING', column: 'MOD_PRICING' },
  { id: 'MOD_ZOOMBOX', column: 'MOD_ZOOMBOX' },
  { id: 'MOD_CONC_CARTAO', column: 'MOD_CONC_CARTAO' },
  { id: 'MOD_CRESCEVENDAS', column: 'MOD_CRESCEVENDAS' },
  { id: 'MOD_MERCAFACIL', column: 'MOD_MERCAFACIL' },
  { id: 'MOD_TOPSISTEMAS', column: 'MOD_TOPSISTEMAS' },
  { id: 'MOD_CARTAZ_FACIL', column: 'MOD_CARTAZ_FACIL' },
  { id: 'Mod_App_Intersolid_One', column: 'MOD_APP_INTERSOLID_ONE' },
  { id: 'MOD_MMC', column: 'MOD_MMC' },
  { id: 'MOD_CLUB_DA_COTACAO', column: 'MOD_CLUB_DA_COTACAO' },
  { id: 'MOD_SICOMPRA', column: 'MOD_SICOMPRA' },
  { id: 'MOD_VERCER', column: 'MOD_VERCER' },
  { id: 'MOD_INSTABUY', column: 'MOD_INSTABUY' },
  { id: 'mod_nexxera', column: 'MOD_NEXXERA' },
  { id: 'MOD_NEXELLO', column: 'MOD_NEXELLO' },
  { id: 'MOD_SIMPLO7', column: 'MOD_SIMPLO7' },
  { id: 'MOD_BIS', column: 'MOD_BIS' },
  { id: 'MOD_PRICEFY', column: 'MOD_PRICEFY' },
  { id: 'MOD_VIPCOMMERCE', column: 'MOD_VIPCOMMERCE' },
  { id: 'MOD_TRAY', column: 'MOD_TRAY' },
  { id: 'MOD_MI7', column: 'MOD_MI7' },
  { id: 'MOD_TRUSTION', column: 'MOD_TRUSTION' },
  { id: 'MOD_BOAVISTA', column: 'MOD_BOAVISTA' },
  { id: 'MOD_WMS_PILAR', column: 'MOD_WMS_PILAR' },
  { id: 'MOD_DATASALES', column: 'MOD_DATASALES' },
  { id: 'MOD_SALESRUN', column: 'MOD_SALESRUN' },
  { id: 'MOD_IZICASH', column: 'MOD_IZICASH' },
  { id: 'MOD_MOBIIS', column: 'MOD_MOBIIS' },
  { id: 'MOD_BEHAPPY', column: 'MOD_BEHAPPY' },
]

export const MODULE_FIELDS_TOTAL = MODULE_FIELDS.length

export interface LicenseIntegerFieldDefinition {
  /** Chave usada no payload (`license[key]`) — igual a `LicenseData` no frontend. */
  key: 'numLicenca' | 'numPdv' | 'numPdvReserva' | 'numPdvBalcao' | 'numPdvRecebto' | 'numDiaVencto'
  column: string
  min: number
  max?: number
}

/** Espelha buildLicenseLines em src/utils/sqlGenerator.ts (exceto NUM_CGC, tratado separadamente). */
export const LICENSE_INTEGER_FIELDS: LicenseIntegerFieldDefinition[] = [
  { key: 'numLicenca', column: 'NUM_LICENCA', min: 0 },
  { key: 'numPdv', column: 'NUM_PDV', min: 0 },
  { key: 'numPdvReserva', column: 'NUM_PDV_RESERVA', min: 0 },
  { key: 'numPdvBalcao', column: 'NUM_PDV_BALCAO', min: 0 },
  { key: 'numPdvRecebto', column: 'NUM_PDV_RECEBTO', min: 0 },
  { key: 'numDiaVencto', column: 'NUM_DIA_VENCTO', min: 1, max: 31 },
]

/** Coluna de CNPJ da licença — sempre reescrita junto com o restante do UPDATE (ver sqlGenerator.ts). */
export const NUM_CGC_COLUMN = 'NUM_CGC'

/** Coluna de chave primária usada no WHERE / SELECT ... FOR UPDATE. */
export const COD_LOJA_COLUMN = 'COD_LOJA'

const MODULE_FIELD_BY_ID = new Map(MODULE_FIELDS.map((field) => [field.id, field]))

export function isKnownModuleId(id: string): boolean {
  return MODULE_FIELD_BY_ID.has(id)
}

/**
 * Resolve o valor S/N de um módulo — mesma regra de exclusividade do NF-e Expert
 * usada em resolveModuleValue (src/utils/sqlGenerator.ts).
 */
export function resolveModuleValue(
  field: ModuleFieldDefinition,
  modules: Record<string, boolean>,
  nfeExpertMode: NfeExpertMode,
): 'S' | 'N' {
  if (field.exclusiveGroup === 'nfe-expert') {
    if (field.id === NFE_EXPERT_EMBEDDED_ID) return nfeExpertMode === 'embedded' ? 'S' : 'N'
    if (field.id === NFE_EXPERT_PARTNER_ID) return nfeExpertMode === 'partner' ? 'S' : 'N'
  }
  return modules[field.id] ? 'S' : 'N'
}

/** Todas as colunas alteráveis pela operação de licença, na ordem do catálogo. */
export function allWhitelistedColumns(): string[] {
  return [...MODULE_FIELDS.map((field) => field.column), ...LICENSE_INTEGER_FIELDS.map((field) => field.column), NUM_CGC_COLUMN]
}
