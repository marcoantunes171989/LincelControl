/**
 * Stub da API Oracle na Vercel.
 * A integração real exige Instant Client + API Node local (npm run dev:server).
 * Este handler evita 404 HTML/texto e devolve JSON claro ao frontend.
 */

const LOCAL_API_HINT =
  'API Oracle não roda na Vercel. Execute localmente: npm run dev:server (porta 8787) e abra o app em http://localhost:5173.'

function stubStatus() {
  return {
    configured: false,
    enabled: false,
    connected: false,
    status: 'oracle_client_unavailable',
    passwordAvailableInMemory: false,
    clientInitialized: false,
    clientVersion: null,
    clientArchitecture: null,
    ociDllFound: null,
    pool: null,
    database: {
      alias: null,
      host: null,
      port: null,
      serviceName: null,
      sid: null,
      instanceName: null,
      serverHost: null,
      databaseName: null,
      sessionUser: null,
      oracleVersion: null,
    },
    paths: {
      tnsAdminPath: null,
      tnsFileName: null,
      oracleClientLibDir: null,
    },
    lastValidatedAt: null,
    lastConnectedAt: null,
    lastValidationDurationMs: null,
    lastError: LOCAL_API_HINT,
    stages: [],
    hostMode: 'vercel-stub',
  }
}

export default function handler(req, res) {
  const parts = req.query.path
  const route = Array.isArray(parts) ? parts.join('/') : parts || ''

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-LicenControl-Api', 'vercel-stub')

  if (req.method === 'GET' && (route === 'status' || route === 'health')) {
    if (route === 'health') {
      res.status(200).json({
        service: 'oracle-integration',
        status: 'unavailable',
        configured: false,
        connected: false,
        databaseReachable: false,
        hostMode: 'vercel-stub',
        message: LOCAL_API_HINT,
        checkedAt: new Date().toISOString(),
      })
      return
    }
    res.status(200).json(stubStatus())
    return
  }

  if (req.method === 'GET' && route === 'configuration') {
    res.status(200).json({ ok: true, configuration: null, hostMode: 'vercel-stub', message: LOCAL_API_HINT })
    return
  }

  res.status(503).json({
    ok: false,
    message: LOCAL_API_HINT,
    hostMode: 'vercel-stub',
    route: route || '(root)',
  })
}
