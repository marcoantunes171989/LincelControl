import type { OracleErrorPayload, ValidationStage } from './types.js'

const ERROR_MAP: Record<string, string> = {
  'DPI-1047': 'Oracle Client não encontrado ou incompatível com a arquitetura do Node.js. Verifique o caminho da OCI.DLL.',
  'ORA-01017': 'Usuário ou senha Oracle inválidos.',
  'ORA-01031': 'Privilégios insuficientes para executar a operação no Oracle.',
  'ORA-01045': 'Usuário sem privilégio CREATE SESSION. Conceda acesso mínimo ao usuário de consulta.',
  'ORA-12154': 'Alias TNS não resolvido. Verifique TNS_ADMIN e o nome do alias.',
  'ORA-12504': 'SERVICE_NAME ou SID não informado corretamente na conexão.',
  'ORA-12505': 'SID informado não existe no listener Oracle.',
  'ORA-12514': 'SERVICE_NAME informado não está registrado no listener Oracle.',
  'ORA-12541': 'Não há listener ativo na porta Oracle informada.',
  'ORA-12543': 'Host Oracle inacessível na rede.',
  'ORA-12545': 'Falha ao conectar no host/destino Oracle informado.',
  'ORA-12560': 'Protocol Adapter Error. Verifique Oracle Client, TNS e serviços locais.',
  'ORA-12570': 'Pacote de rede incompleto ou conexão interrompida com o Oracle.',
  'ORA-12571': 'Falha no handshake de rede com o Oracle (Packet Writer Failure).',
  'ORA-28000': 'Conta Oracle bloqueada.',
  'ORA-28001': 'Senha Oracle expirada.',
  'ORA-28002': 'Senha Oracle irá expirar em breve.',
  'ORA-00054': 'Registro da loja está em uso por outra operação no Oracle. Tente novamente em instantes.',
  'ORA-00060': 'Deadlock detectado no Oracle durante a atualização. Tente novamente.',
  'ORA-02290': 'Valor informado viola uma restrição (CHECK constraint) da TAB_LOJA.',
  'ORA-01438': 'Valor numérico maior do que a coluna da TAB_LOJA permite.',
  'ORA-12170': 'Tempo de conexão com o Oracle esgotado (timeout).',
  'ORA-25408': 'Falha ao reproduzir a operação após queda de conexão com o Oracle.',
  'NJS-040': 'Pool Oracle já existe com este alias.',
  'NJS-047': 'Pool Oracle não encontrado ou já foi encerrado.',
  'NJS-076': 'Não foi possível obter conexão do pool Oracle (fila esgotada/timeout).',
}

function extractCode(message: string): string | null {
  const match = message.match(/\b((?:DPI|ORA|NJS)-\d+)\b/i)
  return match ? match[1].toUpperCase() : null
}

export function translateOracleError(
  error: unknown,
  stage: ValidationStage | string = 'authentication',
): OracleErrorPayload {
  const technicalMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Erro desconhecido no Oracle.'
  const code = extractCode(technicalMessage)
  const message = (code && ERROR_MAP[code]) || 'Falha na integração Oracle.'

  return {
    ok: false,
    stage,
    code,
    message,
    technicalMessage,
  }
}

export function isRecoverableOracleError(error: unknown): boolean {
  const payload = translateOracleError(error)
  if (!payload.code) return true
  return !['DPI-1047'].includes(payload.code)
}
