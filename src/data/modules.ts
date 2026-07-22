import type { ModuleDefinition } from '../types'

/**
 * Catálogo oficial dos 55 módulos da TAB_LOJA.
 * A ordem desta lista é a ordem exata em que os campos aparecem no SET do UPDATE gerado.
 */
export const MODULES: ModuleDefinition[] = [
  { id: 'MOD_MOVIMENTO', label: 'Movimento', field: 'MOD_MOVIMENTO', comment: 'MOVIMENTO', category: 'Base', defaultEnabled: true },
  { id: 'MOD_COMPRAS', label: 'Compras', field: 'MOD_COMPRAS', comment: 'COMPRAS', category: 'Base', defaultEnabled: true },
  { id: 'MOD_VENDAS', label: 'Vendas', field: 'MOD_VENDAS', comment: 'VENDAS', category: 'Base', defaultEnabled: true },
  { id: 'MOD_FINANCEIRO', label: 'Financeiro', field: 'MOD_FINANCEIRO', comment: 'FINANCEIRO', category: 'Base', defaultEnabled: true },
  { id: 'MOD_ANALYTICS', label: 'Analytics', field: 'MOD_ANALYTICS', comment: 'ANALYTICS', category: 'Gestão', defaultEnabled: true },
  { id: 'MOD_DISPLAY', label: 'Display Mix', field: 'MOD_DISPLAY', comment: 'DISPLAY MIX', category: 'Gestão', defaultEnabled: true },
  { id: 'Mod_Gestor_Doc_Fisc', label: 'NF-e Expert Embedded', field: 'Mod_Gestor_Doc_Fisc', comment: 'NFE EXPERT EMBEDDED', category: 'Fiscal', defaultEnabled: true, exclusiveGroup: 'nfe-expert' },
  { id: 'MOD_AGENTE_NF', label: 'NotaFácil', field: 'MOD_AGENTE_NF', comment: 'NOTA FÁCIL', category: 'Fiscal', defaultEnabled: true },
  { id: 'MOD_SITEMERCADO', label: 'Site Mercado', field: 'MOD_SITEMERCADO', comment: 'SITE MERCADO', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_AGENTE_IA', label: 'Agente IA', field: 'MOD_AGENTE_IA', comment: 'AGENTE IA', category: 'Gestão', defaultEnabled: true },
  { id: 'MOD_APP_INTERSOLID_ONE', label: 'Intersolid One', field: 'MOD_APP_INTERSOLID_ONE', comment: 'INTERSOLID ONE', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_BENASSI', label: 'Benassi', field: 'MOD_BENASSI', comment: 'BENASSI', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_CRESCEVENDAS', label: 'Cresce Vendas', field: 'MOD_CRESCEVENDAS', comment: 'CRESCE VENDAS', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_KIKKER', label: 'Kikker', field: 'MOD_KIKKER', comment: 'KIKKER', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_OCTOPO', label: 'Octopo', field: 'MOD_OCTOPO', comment: 'OCTOPO', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_PRICEFY', label: 'Pricefy', field: 'MOD_PRICEFY', comment: 'PRICEFY', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_FISCAL', label: 'Fiscal', field: 'MOD_FISCAL', comment: 'FISCAL', category: 'Base', defaultEnabled: true },
  { id: 'MOD_ONLINE', label: 'On-Line', field: 'MOD_ONLINE', comment: 'ON-LINE', category: 'Base', defaultEnabled: true },
  { id: 'MOD_CN', label: 'Central de Negócios', field: 'MOD_CN', comment: 'CENTRAL DE NEGÓCIOS', category: 'Gestão', defaultEnabled: true },
  { id: 'MOD_GI', label: 'Gestão Inteligente', field: 'MOD_GI', comment: 'GESTÃO INTELIGENTE', category: 'Gestão', defaultEnabled: true },
  { id: 'MOD_CONTABIL', label: 'Contábil', field: 'MOD_CONTABIL', comment: 'CONTÁBIL', category: 'Base', defaultEnabled: true },
  { id: 'MOD_DASHBOARD', label: 'Visual Dash', field: 'MOD_DASHBOARD', comment: 'VISUAL DASH', category: 'Gestão', defaultEnabled: true },
  { id: 'MOD_VELOXCODE', label: 'Velox Code', field: 'MOD_VELOXCODE', comment: 'VELOX CODE', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_SUPRASYS', label: 'Suprasys', field: 'MOD_SUPRASYS', comment: 'SUPRASYS', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_MERCAFACIL', label: 'Mercado Fácil', field: 'MOD_MERCAFACIL', comment: 'MERCADO FÁCIL', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_SIMPLO7', label: 'Simplo7', field: 'MOD_SIMPLO7', comment: 'SIMPLO7', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_VERCER', label: 'Vercer', field: 'MOD_VERCER', comment: 'VERCER', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_CARTAZ', label: 'Cartaz', field: 'MOD_CARTAZ', comment: 'CARTAZ', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_MI7', label: 'MI7', field: 'MOD_MI7', comment: 'MI7', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_SPED_FISCAL', label: 'SPED Fiscal', field: 'MOD_SPED_FISCAL', comment: 'SPED FISCAL', category: 'Fiscal', defaultEnabled: true },
  { id: 'MOD_SPED_CTB', label: 'SPED Contábil', field: 'MOD_SPED_CTB', comment: 'SPED CONTÁBIL', category: 'Contábil', defaultEnabled: true },
  { id: 'MOD_POSTO', label: 'Posto', field: 'MOD_POSTO', comment: 'POSTO', category: 'Segmentos', defaultEnabled: true },
  { id: 'MOD_MOBILE', label: 'Mobile', field: 'MOD_MOBILE', comment: 'MOBILE', category: 'Base', defaultEnabled: true },
  { id: 'MOD_ACORDO', label: 'Acordo Comercial', field: 'MOD_ACORDO', comment: 'ACORDO COMERCIAL', category: 'Gestão', defaultEnabled: true },
  { id: 'MOD_CONC_CARTAO', label: 'Conciliação de Cartão', field: 'MOD_CONC_CARTAO', comment: 'CONCILIAÇÃO DE CARTÃO', category: 'Financeiro', defaultEnabled: true },
  { id: 'MOD_BLING', label: 'Bling', field: 'MOD_BLING', comment: 'BLING', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_INCOLETA', label: 'Incoleta', field: 'MOD_INCOLETA', comment: 'INCOLETA', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_TOPSISTEMAS', label: 'Top Sistemas', field: 'MOD_TOPSISTEMAS', comment: 'TOP SISTEMAS', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_BEHAPPY', label: 'BeHappy', field: 'MOD_BEHAPPY', comment: 'BEHAPPY', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_INSTABUY', label: 'Instabuy', field: 'MOD_INSTABUY', comment: 'INSTABUY', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_WEBJASPER', label: 'WebJasper', field: 'MOD_WEBJASPER', comment: 'WEBJASPER', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_TRAY', label: 'Tray', field: 'MOD_TRAY', comment: 'TRAY', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_ECOMM', label: 'E-Commerce', field: 'MOD_ECOMM', comment: 'E-COMMERCE', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_NFE', label: 'NF-e Expert Partner', field: 'MOD_NFE', comment: 'NFE EXPERT PARTNER', category: 'Fiscal', defaultEnabled: false, exclusiveGroup: 'nfe-expert' },
  { id: 'MOD_MIX_FISCAL', label: 'I.F. / Mix Fiscal', field: 'MOD_MIX_FISCAL', comment: 'I.F.', category: 'Fiscal', defaultEnabled: true },
  { id: 'MOD_COTACAO_WEB', label: 'Cotação Web', field: 'MOD_COTACAO_WEB', comment: 'COTAÇÃO WEB', category: 'Compras', defaultEnabled: true },
  { id: 'MOD_RH', label: 'Recursos Humanos', field: 'MOD_RH', comment: 'RECURSOS HUMANOS', category: 'Administrativo', defaultEnabled: true },
  { id: 'MOD_NEOGRID', label: 'Neogrid', field: 'MOD_NEOGRID', comment: 'NEOGRID', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_SCANNTECH', label: 'Scanntech', field: 'MOD_SCANNTECH', comment: 'SCANNTECH', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_ZOOMBOX', label: 'Zoombox', field: 'MOD_ZOOMBOX', comment: 'ZOOMBOX', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_NEXELLO', label: 'Nexello', field: 'MOD_NEXELLO', comment: 'NEXELLO', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_SICOMPRA', label: 'SiCompra', field: 'MOD_SICOMPRA', comment: 'SICOMPRA', category: 'Integrações', defaultEnabled: false },
  { id: 'MOD_MMC', label: 'MMC', field: 'MOD_MMC', comment: 'MMC', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_BIS', label: 'BIS', field: 'MOD_BIS', comment: 'BIS', category: 'Integrações', defaultEnabled: true },
  { id: 'MOD_VIPCOMMERCE', label: 'VipCommerce', field: 'MOD_VIPCOMMERCE', comment: 'VIPCOMMERCE', category: 'Integrações', defaultEnabled: true },
]

export const MODULES_TOTAL = MODULES.length

export const MODULE_CATEGORIES = Array.from(new Set(MODULES.map((m) => m.category))).sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
)

export const NFE_EXPERT_EMBEDDED_FIELD = 'Mod_Gestor_Doc_Fisc'
export const NFE_EXPERT_PARTNER_FIELD = 'MOD_NFE'
