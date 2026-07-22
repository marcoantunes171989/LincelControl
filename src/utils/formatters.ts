export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '')
}

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function sanitizeSingleLine(value: string): string {
  return value.replace(/\r\n|\r|\n/g, ' ').trim()
}

export function formatCnpjMask(value: string): string {
  const digits = normalizeCnpj(value).slice(0, 14)
  const ddd = digits.slice(0, 2)
  const grupo1 = digits.slice(2, 5)
  const grupo2 = digits.slice(5, 8)
  const filial = digits.slice(8, 12)
  const dv = digits.slice(12, 14)

  let out = ddd
  if (grupo1) out += `.${grupo1}`
  if (grupo2) out += `.${grupo2}`
  if (filial) out += `/${filial}`
  if (dv) out += `-${dv}`
  return out
}
