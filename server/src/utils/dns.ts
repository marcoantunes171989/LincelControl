import dns from 'node:dns/promises'
import net from 'node:net'

export interface DnsLookupResult {
  ok: boolean
  host: string
  isIp: boolean
  addresses: string[]
  message: string
}

export async function resolveHost(host: string): Promise<DnsLookupResult> {
  if (net.isIP(host)) {
    return {
      ok: true,
      host,
      isIp: true,
      addresses: [host],
      message: 'HOST informado já é um endereço IP.',
    }
  }

  try {
    const addresses = await dns.lookup(host, { all: true })
    const ips = addresses.map((item) => item.address)
    return {
      ok: ips.length > 0,
      host,
      isIp: false,
      addresses: ips,
      message: ips.length > 0 ? `DNS resolvido: ${ips.join(', ')}` : 'Nenhum endereço DNS encontrado.',
    }
  } catch (error) {
    return {
      ok: false,
      host,
      isIp: false,
      addresses: [],
      message: error instanceof Error ? error.message : 'Falha na resolução DNS.',
    }
  }
}
