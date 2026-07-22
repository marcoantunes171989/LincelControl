import { MODULES } from './modules'
import type { AppFormState, ModuleState, NfeExpertMode, StoreData, LicenseData } from '../types'

export const EXAMPLE_STORE: StoreData = {
  codLoja: '1',
  numCgc: '02274225000161',
  descricao: 'JACI SUPERMERCADOS LTDA',
}

export const EXAMPLE_LICENSE: LicenseData = {
  numLicenca: '9090',
  numDiaVencto: '5',
  numPdv: '100',
  numPdvBalcao: '1',
  numPdvReserva: '0',
  numPdvRecebto: '1',
}

export const EXAMPLE_NFE_EXPERT_MODE: NfeExpertMode = 'embedded'

/** Estado dos módulos que não pertencem ao grupo exclusivo NF-e Expert. */
export function buildModuleState(
  resolve: (defaultEnabled: boolean) => boolean = (defaultEnabled) => defaultEnabled,
): ModuleState {
  const state: ModuleState = {}
  for (const module of MODULES) {
    if (module.exclusiveGroup) continue
    state[module.id] = resolve(module.defaultEnabled)
  }
  return state
}

export const EXAMPLE_MODULE_STATE: ModuleState = buildModuleState()

export const EMPTY_STORE: StoreData = {
  codLoja: '',
  numCgc: '',
  descricao: '',
}

export const EMPTY_LICENSE: LicenseData = {
  numLicenca: '',
  numDiaVencto: '',
  numPdv: '0',
  numPdvBalcao: '0',
  numPdvReserva: '0',
  numPdvRecebto: '0',
}

export const EMPTY_MODULE_STATE: ModuleState = buildModuleState(() => false)

export const EMPTY_NFE_EXPERT_MODE: NfeExpertMode = 'nenhuma'

export const EXAMPLE_FORM_STATE: AppFormState = {
  store: EXAMPLE_STORE,
  license: EXAMPLE_LICENSE,
  modules: EXAMPLE_MODULE_STATE,
  nfeExpertMode: EXAMPLE_NFE_EXPERT_MODE,
}

export const EMPTY_FORM_STATE: AppFormState = {
  store: EMPTY_STORE,
  license: EMPTY_LICENSE,
  modules: EMPTY_MODULE_STATE,
  nfeExpertMode: EMPTY_NFE_EXPERT_MODE,
}
