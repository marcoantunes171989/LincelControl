import type { TnsAddress, TnsAliasInfo } from './types.js'

function stripComments(content: string): string {
  return content
    .split(/\r?\n/)
    .map((line) => {
      const hashIndex = line.indexOf('#')
      if (hashIndex >= 0) return line.slice(0, hashIndex)
      return line
    })
    .join('\n')
}

function extractBalancedBlock(source: string, startIndex: number): { block: string; endIndex: number } | null {
  let depth = 0
  let started = false
  for (let i = startIndex; i < source.length; i += 1) {
    const char = source[i]
    if (char === '(') {
      depth += 1
      started = true
    } else if (char === ')') {
      depth -= 1
      if (started && depth === 0) {
        return { block: source.slice(startIndex, i + 1), endIndex: i + 1 }
      }
    }
  }
  return null
}

function findKeyValues(block: string, key: string): string[] {
  const values: string[] = []
  const pattern = new RegExp(`\\(\\s*${key}\\s*=\\s*([^)\\n]+)\\s*\\)`, 'gi')
  let match: RegExpExecArray | null
  while ((match = pattern.exec(block)) !== null) {
    values.push(match[1].trim())
  }
  return values
}

function parseAddresses(descriptionBlock: string): TnsAddress[] {
  const addresses: TnsAddress[] = []
  const addressRegex = /\(\s*ADDRESS\s*=/gi
  let match: RegExpExecArray | null

  while ((match = addressRegex.exec(descriptionBlock)) !== null) {
    const extracted = extractBalancedBlock(descriptionBlock, match.index)
    if (!extracted) continue
    const addressBlock = extracted.block
    const protocol = findKeyValues(addressBlock, 'PROTOCOL')[0] ?? null
    const host = findKeyValues(addressBlock, 'HOST')[0] ?? null
    const portRaw = findKeyValues(addressBlock, 'PORT')[0] ?? null
    const port = portRaw ? Number.parseInt(portRaw, 10) : null
    addresses.push({
      protocol,
      host,
      port: Number.isFinite(port) ? port : null,
    })
    addressRegex.lastIndex = extracted.endIndex
  }

  return addresses
}

function parseAliasEntry(alias: string, descriptionSource: string): TnsAliasInfo {
  const addresses = parseAddresses(descriptionSource)
  const hosts = [...new Set(addresses.map((item) => item.host).filter((value): value is string => Boolean(value)))]
  const ports = [
    ...new Set(addresses.map((item) => item.port).filter((value): value is number => typeof value === 'number')),
  ]
  const protocols = [
    ...new Set(addresses.map((item) => item.protocol).filter((value): value is string => Boolean(value))),
  ]

  const serviceName = findKeyValues(descriptionSource, 'SERVICE_NAME')[0] ?? null
  const sid = findKeyValues(descriptionSource, 'SID')[0] ?? null
  const hasAddressList = /\(\s*ADDRESS_LIST\s*=/i.test(descriptionSource)
  const hasFailover = /FAILOVER\s*=\s*ON/i.test(descriptionSource) || (hasAddressList && addresses.length > 1)

  return {
    alias,
    hosts,
    ports,
    protocols,
    serviceName,
    sid,
    addresses,
    hasFailover,
    hasMultipleHosts: hosts.length > 1,
  }
}

/**
 * Parser robusto de tnsnames.ora baseado em contagem de parênteses.
 * Ignora comentários (#) e diferencia aliases corretamente.
 */
export function parseTnsNames(content: string): TnsAliasInfo[] {
  const cleaned = stripComments(content)
  const aliases: TnsAliasInfo[] = []
  const aliasRegex = /^\s*([A-Za-z0-9_.$-]+)\s*=\s*/gm
  let match: RegExpExecArray | null

  while ((match = aliasRegex.exec(cleaned)) !== null) {
    const alias = match[1]
    const afterEquals = match.index + match[0].length
    const nextNonSpace = cleaned.slice(afterEquals).search(/\S/)
    if (nextNonSpace < 0) continue
    const blockStart = afterEquals + nextNonSpace
    if (cleaned[blockStart] !== '(') continue

    const extracted = extractBalancedBlock(cleaned, blockStart)
    if (!extracted) continue

    aliases.push(parseAliasEntry(alias, extracted.block))
    aliasRegex.lastIndex = extracted.endIndex
  }

  return aliases
}

export function listTnsAliases(content: string): string[] {
  return parseTnsNames(content).map((item) => item.alias)
}

export function findTnsAlias(content: string, alias: string): TnsAliasInfo | null {
  const normalized = alias.trim().toUpperCase()
  return parseTnsNames(content).find((item) => item.alias.toUpperCase() === normalized) ?? null
}
