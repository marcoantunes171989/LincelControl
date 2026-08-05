import { describe, expect, it } from 'vitest'
import { maskSensitive } from '../src/utils/logger.js'

describe('maskSensitive', () => {
  it('mascara senha em objetos', () => {
    const masked = maskSensitive({ username: 'app', password: 'segredo123' }) as Record<string, unknown>
    expect(masked.username).toBe('app')
    expect(masked.password).not.toBe('segredo123')
  })

  it('mascara strings com password=', () => {
    const masked = maskSensitive('user=x password=abc123 connectString=ORCL') as string
    expect(masked).toContain('password=****')
    expect(masked).not.toContain('abc123')
  })
})
