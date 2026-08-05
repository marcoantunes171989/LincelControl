const SENSITIVE_KEYS = [
  'password',
  'senha',
  'pwd',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'connectString',
  'connectionString',
]

function maskValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= 4) return '****'
    return `${value.slice(0, 2)}***${value.slice(-1)}`
  }
  return '[REDACTED]'
}

export function maskSensitive(input: unknown): unknown {
  if (input === null || input === undefined) return input
  if (typeof input === 'string') {
    let masked = input
    for (const key of SENSITIVE_KEYS) {
      const pattern = new RegExp(`(${key}\\s*[=:]\\s*)([^\\s,;}]+)`, 'gi')
      masked = masked.replace(pattern, `$1****`)
    }
    return masked
  }
  if (Array.isArray(input)) return input.map(maskSensitive)
  if (typeof input === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((item) => key.toLowerCase().includes(item.toLowerCase()))) {
        result[key] = maskValue(value)
      } else {
        result[key] = maskSensitive(value)
      }
    }
    return result
  }
  return input
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function write(level: LogLevel, message: string, meta?: unknown): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined ? { meta: maskSensitive(meta) } : {}),
  }
  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
}
