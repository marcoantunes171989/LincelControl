import type { LicenseData, StoreData, ValidationErrors } from '../types'
import { normalizeCnpj } from './formatters'

const INTEGER_REGEX = /^[0-9]+$/

function validateRequiredNonNegativeInteger(
  rawValue: string,
  fieldLabel: string,
  options: { min?: number; max?: number } = {},
): string | undefined {
  const value = rawValue.trim()
  if (value === '') return `${fieldLabel} é obrigatório.`
  if (!INTEGER_REGEX.test(value)) {
    return `${fieldLabel} deve conter apenas números inteiros, sem sinais, letras ou notação científica.`
  }
  const numeric = Number(value)
  if (options.min !== undefined && numeric < options.min) {
    return `${fieldLabel} deve ser maior ou igual a ${options.min}.`
  }
  if (options.max !== undefined && numeric > options.max) {
    return `${fieldLabel} deve ser menor ou igual a ${options.max}.`
  }
  return undefined
}

export function validateCodLoja(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'Código da loja', { min: 1 })
}

export function validateCnpj(value: string): string | undefined {
  const digits = normalizeCnpj(value)
  if (digits.length === 0) return 'CNPJ é obrigatório.'
  if (digits.length !== 14) return 'CNPJ deve conter exatamente 14 dígitos.'
  return undefined
}

export function validateNumLicenca(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'Número da licença', { min: 0 })
}

export function validateNumDiaVencto(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'Dia de vencimento do boleto', { min: 1, max: 31 })
}

export function validateNumPdv(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'PDVs ativos', { min: 0 })
}

export function validateNumPdvBalcao(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'PDV venda balcão', { min: 0 })
}

export function validateNumPdvReserva(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'PDV reservas', { min: 0 })
}

export function validateNumPdvRecebto(value: string): string | undefined {
  return validateRequiredNonNegativeInteger(value, 'PDV recebimento', { min: 0 })
}

export function validateStoreData(store: StoreData): Pick<ValidationErrors, 'codLoja' | 'numCgc'> {
  const errors: Pick<ValidationErrors, 'codLoja' | 'numCgc'> = {}
  const codLojaError = validateCodLoja(store.codLoja)
  if (codLojaError) errors.codLoja = codLojaError
  const numCgcError = validateCnpj(store.numCgc)
  if (numCgcError) errors.numCgc = numCgcError
  return errors
}

export function validateLicenseData(
  license: LicenseData,
): Pick<
  ValidationErrors,
  'numLicenca' | 'numDiaVencto' | 'numPdv' | 'numPdvBalcao' | 'numPdvReserva' | 'numPdvRecebto'
> {
  const errors: ValidationErrors = {}
  const numLicencaError = validateNumLicenca(license.numLicenca)
  if (numLicencaError) errors.numLicenca = numLicencaError
  const numDiaVenctoError = validateNumDiaVencto(license.numDiaVencto)
  if (numDiaVenctoError) errors.numDiaVencto = numDiaVenctoError
  const numPdvError = validateNumPdv(license.numPdv)
  if (numPdvError) errors.numPdv = numPdvError
  const numPdvBalcaoError = validateNumPdvBalcao(license.numPdvBalcao)
  if (numPdvBalcaoError) errors.numPdvBalcao = numPdvBalcaoError
  const numPdvReservaError = validateNumPdvReserva(license.numPdvReserva)
  if (numPdvReservaError) errors.numPdvReserva = numPdvReservaError
  const numPdvRecebtoError = validateNumPdvRecebto(license.numPdvRecebto)
  if (numPdvRecebtoError) errors.numPdvRecebto = numPdvRecebtoError
  return errors
}

export function validateAll(store: StoreData, license: LicenseData): ValidationErrors {
  return {
    ...validateStoreData(store),
    ...validateLicenseData(license),
  }
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((message) => Boolean(message))
}
