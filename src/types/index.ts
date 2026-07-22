export interface StoreData {
  codLoja: string
  numCgc: string
  descricao: string
}

export interface LicenseData {
  numLicenca: string
  numDiaVencto: string
  numPdv: string
  numPdvBalcao: string
  numPdvReserva: string
  numPdvRecebto: string
}

export type NfeExpertMode = 'nenhuma' | 'embedded' | 'partner'

export type ModuleCategory =
  | 'Base'
  | 'Gestão'
  | 'Fiscal'
  | 'Integrações'
  | 'Contábil'
  | 'Segmentos'
  | 'Financeiro'
  | 'Administrativo'
  | 'Compras'

export const NFE_EXPERT_EXCLUSIVE_GROUP = 'nfe-expert' as const

export interface ModuleDefinition {
  id: string
  label: string
  field: string
  comment: string
  category: ModuleCategory
  defaultEnabled: boolean
  exclusiveGroup?: typeof NFE_EXPERT_EXCLUSIVE_GROUP
}

export type ModuleState = Record<string, boolean>

export interface ValidationErrors {
  codLoja?: string
  numCgc?: string
  numLicenca?: string
  numDiaVencto?: string
  numPdv?: string
  numPdvBalcao?: string
  numPdvReserva?: string
  numPdvRecebto?: string
}

export interface AppFormState {
  store: StoreData
  license: LicenseData
  modules: ModuleState
  nfeExpertMode: NfeExpertMode
}

export type FormStatus = 'incomplete' | 'needs-validation' | 'valid'

export type ModuleStatusFilter = 'all' | 'selected' | 'unselected'
