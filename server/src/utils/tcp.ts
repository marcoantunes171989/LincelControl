import net from 'node:net'

export interface TcpProbeResult {
  ok: boolean
  host: string
  port: number
  durationMs: number
  message: string
}

export function testTcpConnection(host: string, port: number, timeoutMs: number): Promise<TcpProbeResult> {
  const started = Date.now()

  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const finish = (ok: boolean, message: string) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve({
        ok,
        host,
        port,
        durationMs: Date.now() - started,
        message,
      })
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true, `Conexão TCP estabelecida em ${host}:${port}.`))
    socket.once('timeout', () => finish(false, `Timeout ao conectar em ${host}:${port} (${timeoutMs}ms).`))
    socket.once('error', (error) => finish(false, `Falha TCP em ${host}:${port}: ${error.message}`))
    socket.connect(port, host)
  })
}
