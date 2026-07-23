import type { ModuleDefinition } from '../types'

/**
 * Catálogo oficial dos 62 campos de módulos/integrações da TAB_LOJA.
 * A ordem desta lista é a ordem exata em que os campos aparecem no SET do UPDATE gerado.
 * Fonte: planilha de mapeamento secao / item_tela / tabela / coluna_tab_loja.
 */
export const MODULES: ModuleDefinition[] = [
  // secao: Modulo
  { id: 'MOD_MOVIMENTO', label: 'Movimento', field: 'MOD_MOVIMENTO', comment: 'MOVIMENTO', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_COMPRAS', label: 'Compras', field: 'MOD_COMPRAS', comment: 'COMPRAS', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_VENDAS', label: 'Vendas', field: 'MOD_VENDAS', comment: 'VENDAS', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_ONLINE', label: 'On-Line', field: 'MOD_ONLINE', comment: 'ON-LINE', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_CN', label: 'Central de Negócios', field: 'MOD_CN', comment: 'CENTRAL DE NEGÓCIOS', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_INCOLETA', label: 'Incoleta', field: 'MOD_INCOLETA', comment: 'INCOLETA', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_GI', label: 'Gestão Inteligente', field: 'MOD_GI', comment: 'GESTÃO INTELIGENTE', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_FINANCEIRO', label: 'Financeiro', field: 'MOD_FINANCEIRO', comment: 'FINANCEIRO', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_FISCAL', label: 'Fiscal', field: 'MOD_FISCAL', comment: 'FISCAL', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_CONTABIL', label: 'Contábil', field: 'MOD_CONTABIL', comment: 'CONTÁBIL', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_MOBILE', label: 'Mobile', field: 'MOD_MOBILE', comment: 'MOBILE', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_SPED_FISCAL', label: 'SPED Fiscal', field: 'MOD_SPED_FISCAL', comment: 'SPED FISCAL', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_SPED_CTB', label: 'SPED Contábil', field: 'MOD_SPED_CTB', comment: 'SPED CONTÁBIL', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_COTACAO_WEB', label: 'Cotação Web', field: 'MOD_COTACAO_WEB', comment: 'COTAÇÃO WEB', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_DISPLAY', label: 'Display Mix', field: 'MOD_DISPLAY', comment: 'DISPLAY MIX', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_DASHBOARD', label: 'Visual Dash', field: 'MOD_DASHBOARD', comment: 'VISUAL DASH', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_AGENTE_NF', label: 'NotaFácil', field: 'MOD_AGENTE_NF', comment: 'NOTA FÁCIL', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_OCTOPO', label: 'Octopo', field: 'MOD_OCTOPO', comment: 'OCTOPO', category: 'Módulo', defaultEnabled: true },
  { id: 'mod_gestor_doc_fisc', label: 'NF-e Expert Embedded', field: 'mod_gestor_doc_fisc', comment: 'NFE EXPERT EMBEDDED', category: 'Módulo', defaultEnabled: true, exclusiveGroup: 'nfe-expert' },
  { id: 'MOD_NFE', label: 'NF-e Expert Partner', field: 'MOD_NFE', comment: 'NFE EXPERT PARTNER', category: 'Módulo', defaultEnabled: false, exclusiveGroup: 'nfe-expert' },
  { id: 'MOD_AGENTE_IA', label: 'Agente de I.A', field: 'MOD_AGENTE_IA', comment: 'AGENTE DE IA', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_ANALYTICS', label: 'Analytics', field: 'MOD_ANALYTICS', comment: 'ANALYTICS', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_CARTAZ', label: 'Cartaz A4', field: 'MOD_CARTAZ', comment: 'CARTAZ A4', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_ACORDO', label: 'Acordo Comercial', field: 'MOD_ACORDO', comment: 'ACORDO COMERCIAL', category: 'Módulo', defaultEnabled: true },
  { id: 'MOD_RH', label: 'Recursos Humanos', field: 'MOD_RH', comment: 'RECURSOS HUMANOS', category: 'Módulo', defaultEnabled: true },

  // secao: Integracao
  { id: 'MOD_MIX_FISCAL', label: 'I.F.', field: 'MOD_MIX_FISCAL', comment: 'I.F.', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_SITEMERCADO', label: 'SiteMercado', field: 'MOD_SITEMERCADO', comment: 'SITE MERCADO', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_VELOXCODE', label: 'Velox Code', field: 'MOD_VELOXCODE', comment: 'VELOX CODE', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_SCANNTECH', label: 'Scanntech', field: 'MOD_SCANNTECH', comment: 'SCANNTECH', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_BENASSI', label: 'Benassi', field: 'MOD_BENASSI', comment: 'BENASSI', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_BIGDATA', label: 'BigData', field: 'MOD_BIGDATA', comment: 'BIGDATA', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_SUPRASYS', label: 'Suprasys', field: 'MOD_SUPRASYS', comment: 'SUPRASYS', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_KIKKER', label: 'Kikker', field: 'MOD_KIKKER', comment: 'KIKKER', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_PRICING', label: 'Mix Pricing', field: 'MOD_PRICING', comment: 'MIX PRICING', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_ZOOMBOX', label: 'Zoombox', field: 'MOD_ZOOMBOX', comment: 'ZOOMBOX', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_CONC_CARTAO', label: 'Conciliação de Cartão', field: 'MOD_CONC_CARTAO', comment: 'CONCILIAÇÃO DE CARTÃO', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_CRESCEVENDAS', label: 'Cresce Vendas', field: 'MOD_CRESCEVENDAS', comment: 'CRESCE VENDAS', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_MERCAFACIL', label: 'Mercafácil', field: 'MOD_MERCAFACIL', comment: 'MERCAFÁCIL', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_TOPSISTEMAS', label: 'Top Sistemas', field: 'MOD_TOPSISTEMAS', comment: 'TOP SISTEMAS', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_CARTAZ_FACIL', label: 'Cartaz Fácil', field: 'MOD_CARTAZ_FACIL', comment: 'CARTAZ FÁCIL', category: 'Integração', defaultEnabled: true },
  { id: 'Mod_App_Intersolid_One', label: 'Intersolid One', field: 'Mod_App_Intersolid_One', comment: 'INTERSOLID ONE', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_MMC', label: 'Meu Mercado em Casa', field: 'MOD_MMC', comment: 'MEU MERCADO EM CASA', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_CLUB_DA_COTACAO', label: 'Club da Cotação', field: 'MOD_CLUB_DA_COTACAO', comment: 'CLUB DA COTAÇÃO', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_SICOMPRA', label: 'SiCompra', field: 'MOD_SICOMPRA', comment: 'SICOMPRA', category: 'Integração', defaultEnabled: false },
  { id: 'MOD_VERCER', label: 'Vercer', field: 'MOD_VERCER', comment: 'VERCER', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_INSTABUY', label: 'Instabuy', field: 'MOD_INSTABUY', comment: 'INSTABUY', category: 'Integração', defaultEnabled: true },
  { id: 'mod_nexxera', label: 'Hubly', field: 'mod_nexxera', comment: 'HUBLY', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_NEXELLO', label: 'Nexello', field: 'MOD_NEXELLO', comment: 'NEXELLO', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_SIMPLO7', label: 'Simplo7', field: 'MOD_SIMPLO7', comment: 'SIMPLO7', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_BIS', label: 'BIS', field: 'MOD_BIS', comment: 'BIS', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_PRICEFY', label: 'Pricefy', field: 'MOD_PRICEFY', comment: 'PRICEFY', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_VIPCOMMERCE', label: 'VipCommerce', field: 'MOD_VIPCOMMERCE', comment: 'VIPCOMMERCE', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_TRAY', label: 'Tray', field: 'MOD_TRAY', comment: 'TRAY', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_MI7', label: 'MI7', field: 'MOD_MI7', comment: 'MI7', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_TRUSTION', label: 'Trustion', field: 'MOD_TRUSTION', comment: 'TRUSTION', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_BOAVISTA', label: 'Boa Vista', field: 'MOD_BOAVISTA', comment: 'BOA VISTA', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_WMS_PILAR', label: 'WMS Pilar', field: 'MOD_WMS_PILAR', comment: 'WMS PILAR', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_DATASALES', label: 'DataSales', field: 'MOD_DATASALES', comment: 'DATASALES', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_SALESRUN', label: 'SalesRun', field: 'MOD_SALESRUN', comment: 'SALESRUN', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_IZICASH', label: 'Izicash', field: 'MOD_IZICASH', comment: 'IZICASH', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_MOBIIS', label: 'Mobiis', field: 'MOD_MOBIIS', comment: 'MOBIIS', category: 'Integração', defaultEnabled: true },
  { id: 'MOD_BEHAPPY', label: 'BeHappy', field: 'MOD_BEHAPPY', comment: 'BEHAPPY', category: 'Integração', defaultEnabled: true },
]

export const MODULES_TOTAL = MODULES.length

export const MODULE_CATEGORIES = Array.from(new Set(MODULES.map((m) => m.category))).sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
)

export const NFE_EXPERT_EMBEDDED_FIELD = 'mod_gestor_doc_fisc'
export const NFE_EXPERT_PARTNER_FIELD = 'MOD_NFE'
