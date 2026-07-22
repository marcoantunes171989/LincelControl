import { describe, expect, it } from 'vitest'
import type { LicenseData, StoreData } from '../types'
import {
  hasValidationErrors,
  validateAll,
  validateCnpj,
  validateCodLoja,
  validateNumDiaVencto,
  validateNumLicenca,
  validateNumPdv,
} from '../utils/validators'

describe('validateCodLoja', () => {
  it('aceita um número inteiro positivo', () => {
    expect(validateCodLoja('1')).toBeUndefined()
  })

  it('rejeita valores vazios', () => {
    expect(validateCodLoja('')).toBeDefined()
  })

  it('rejeita valores não numéricos', () => {
    expect(validateCodLoja('abc')).toBeDefined()
  })

  it('rejeita notação científica', () => {
    expect(validateCodLoja('1e3')).toBeDefined()
  })

  it('rejeita zero, abaixo do mínimo permitido', () => {
    expect(validateCodLoja('0')).toBeDefined()
  })
})

describe('validateCnpj', () => {
  it('aceita CNPJ com 14 dígitos', () => {
    expect(validateCnpj('02274225000161')).toBeUndefined()
  })

  it('aceita CNPJ formatado com máscara', () => {
    expect(validateCnpj('02.274.225/0001-61')).toBeUndefined()
  })

  it('rejeita CNPJ com menos de 14 dígitos', () => {
    expect(validateCnpj('123')).toBeDefined()
  })

  it('rejeita CNPJ vazio', () => {
    expect(validateCnpj('')).toBeDefined()
  })
})

describe('validateNumDiaVencto', () => {
  it('aceita valores entre 1 e 31', () => {
    expect(validateNumDiaVencto('1')).toBeUndefined()
    expect(validateNumDiaVencto('31')).toBeUndefined()
  })

  it('rejeita valores fora do intervalo permitido', () => {
    expect(validateNumDiaVencto('0')).toBeDefined()
    expect(validateNumDiaVencto('32')).toBeDefined()
  })
})

describe('validateNumLicenca / validateNumPdv', () => {
  it('rejeita valores negativos', () => {
    expect(validateNumLicenca('-1')).toBeDefined()
    expect(validateNumPdv('-5')).toBeDefined()
  })

  it('aceita zero para PDVs', () => {
    expect(validateNumPdv('0')).toBeUndefined()
  })

  it('rejeita caracteres especiais', () => {
    expect(validateNumPdv('10#')).toBeDefined()
  })
})

describe('validateAll / hasValidationErrors', () => {
  const validStore: StoreData = { codLoja: '1', numCgc: '02274225000161', descricao: 'Loja' }
  const validLicense: LicenseData = {
    numLicenca: '9090',
    numDiaVencto: '5',
    numPdv: '100',
    numPdvBalcao: '1',
    numPdvReserva: '0',
    numPdvRecebto: '1',
  }

  it('não retorna erros para dados válidos', () => {
    const errors = validateAll(validStore, validLicense)
    expect(hasValidationErrors(errors)).toBe(false)
  })

  it('bloqueia geração quando há valores inválidos', () => {
    const invalidLicense: LicenseData = { ...validLicense, numDiaVencto: '40' }
    const errors = validateAll(validStore, invalidLicense)
    expect(hasValidationErrors(errors)).toBe(true)
  })
})
