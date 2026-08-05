# LicenControl — Controle de Licenças

Aplicação para geração de scripts `UPDATE TAB_LOJA` e integração opcional com Oracle Database do cliente via **Oracle Client + TNS**.

## Arquitetura

```text
Frontend (React + Vite)
        |
        v
API interna (Node.js + Express)   ← pasta server/
        |
        v
Módulo Oracle / Pool (node-oracledb Thick)
        |
        v
Oracle Client + tnsnames.ora
        |
        v
Banco Oracle do cliente
```

O navegador **nunca** se conecta diretamente ao Oracle. Credenciais, caminhos sensíveis e SQL interno ficam no backend.

## Tecnologias

| Camada | Stack |
|--------|--------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, Vitest |
| Backend | Node.js 18+, Express 5, `oracledb`, Zod, Helmet, CORS, rate-limit |
| Persistência de config | JSON (`server/data/oracle_connection_settings.json`) — **sem senha** |

## Pré-requisitos

- Node.js **18+** (recomendado 20 LTS)
- Arquitetura do Node compatível com o Oracle Client (**x64** com Instant Client 64-bit)
- Oracle Instant Client (ou Oracle Client completo) instalado na máquina da API
- Arquivo `tnsnames.ora` acessível (local ou UNC)
- Permissão de leitura no diretório de rede (serviço Windows pode não ver unidades mapeadas como `Z:\` — prefira UNC)

### Oracle Client / OCI.DLL

1. Instale o Instant Client (ex.: `C:\Oracle\instantclient_19_25`)
2. Confirme a presença de `OCI.DLL` nesse diretório
3. Defina `ORACLE_CLIENT_LIB_DIR` apontando para o diretório
4. Defina `ORACLE_TNS_ADMIN` (ou configure na tela) para o diretório do `tnsnames.ora`

### Caminho UNC

```text
\\SERVIDOR-ARQUIVOS\Oracle\Network\Admin
```

O processo da API precisa de permissão de leitura nessa pasta.

## Instalação

```bash
npm install
npm install --prefix server
```

Copie o exemplo de ambiente:

```bash
copy .env.example .env
```

Ajuste pelo menos:

- `ORACLE_CLIENT_LIB_DIR`
- `ORACLE_TNS_ADMIN` (opcional no .env se for configurar pela UI)
- `ADMIN_API_KEY` (obrigatório em produção)
- `CORS_ORIGIN`

## Execução local

Terminal 1 — API:

```bash
npm run dev:server
```

Terminal 2 — Frontend:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`
- Em desenvolvimento, o Vite faz proxy de `/api` → `8787`

Produção da API:

```bash
npm run build:server
npm run start:server
```

## Integração Oracle (UI)

1. Abra **Integração Oracle** na navegação superior
2. Informe o caminho do Oracle Client e valide (`OCI.DLL`)
3. Informe o diretório TNS (preferencialmente UNC) e liste os aliases
4. Selecione o alias; HOST/PORT/SERVICE_NAME são extraídos automaticamente
5. Confira os valores esperados e informe usuário/senha
6. Clique em **Validar credenciais** (etapas: Client → TNS → DNS → TCP → TNSPING → login → DUAL)
7. Use o interruptor **Desconectado / Conectado** para criar ou fechar o pool

Ao desligar o interruptor:

- o pool é fechado
- as configurações permanecem
- a senha fica só em memória enquanto o processo da API estiver ativo
- após reiniciar a API, a senha precisa ser informada novamente

### Estados

Não configurado · Validando · Conectando · Conectado · Desconectando · Desconectado · Erro · Senha necessária · Oracle Client indisponível · TNS indisponível · Banco inacessível

## Endpoints internos

Todos sob `/api/oracle` (exceto health geral em `/api/health`).

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/api/oracle/health` | `oracle.view_status` |
| GET | `/api/oracle/status` | `oracle.view_status` |
| GET/POST | `/api/oracle/configuration` | `oracle.configure` |
| GET/POST | `/api/oracle/tns-aliases` | `oracle.configure` |
| POST | `/api/oracle/validate` | `oracle.validate` |
| POST | `/api/oracle/connect` | `oracle.connect` |
| POST | `/api/oracle/disconnect` | `oracle.disconnect` |
| POST | `/api/oracle/toggle` | connect + disconnect |
| POST | `/api/oracle/query` | `oracle.query_dashboard` |

Autenticação: header `X-Admin-Api-Key` (ou `Authorization: Bearer <key>`). Em desenvolvimento, se `ADMIN_API_KEY` estiver vazia, o acesso local é liberado.

A senha **nunca** é retornada nas respostas.

## Consultas de dashboard (catálogo)

O frontend envia apenas:

```json
{
  "queryId": "connection-info",
  "binds": {}
}
```

Consultas genéricas já disponíveis:

- `connection-info`
- `database-datetime`
- `accessible-tables-count`
- `schema-tables` (`offset`, `limit`)
- `table-columns` (`tableName`, `offset`, `limit`)

### Como cadastrar uma nova consulta

Edite `server/src/oracle/queryCatalog.ts`:

```javascript
'licencas-ativas': {
  description: 'Licenças ativas',
  sql: `SELECT ... FROM <tabela_real_do_cliente> WHERE ...`,
  allowedBinds: ['offset', 'limit'],
  maxRows: 100,
}
```

Não invente nomes de tabelas do cliente. Só adicione após mapear o schema real. SQL livre do frontend permanece desabilitado (`ORACLE_ALLOW_RAW_SQL=false`).

## Segurança

- Senha Oracle somente em memória no processo da API
- Configuração persistida sem senha (SQLite)
- Rate limit nas rotas de validação/conexão
- Proteção contra tentativas repetidas de senha
- Helmet + CORS restrito
- Erros sanitizados (sem stack trace em produção)
- Logs com mascaramento de segredos
- Usuário Oracle recomendado: apenas `CREATE SESSION` + `SELECT` necessário

## Diagnóstico de erros comuns

| Código | Significado |
|--------|-------------|
| DPI-1047 | Oracle Client / OCI.DLL ausente ou arquitetura incompatível |
| ORA-01017 | Usuário/senha inválidos |
| ORA-12154 | Alias TNS não resolvido |
| ORA-12514 | SERVICE_NAME desconhecido no listener |
| ORA-12541 | Listener indisponível |
| ORA-28000 | Conta bloqueada |
| ORA-28001 | Senha expirada |

## Gerador SQL (funcionalidade original)

A aba **Gerador SQL** continua 100% front-end para montar o `UPDATE TAB_LOJA`. O script não é executado automaticamente no Oracle — revise antes de rodar manualmente, ou use a integração Oracle apenas para consultas de catálogo/dashboard.

## Scripts

```bash
npm run dev            # frontend
npm run dev:server     # API Oracle
npm run test           # testes web + server
npm run lint           # oxlint web + server
npm run build          # build web + server
```

## Desativar a integração Oracle

1. Desligue o interruptor na UI, ou
2. Não inicie a API (`server/`), ou
3. Remova/ignore as variáveis `ORACLE_*`

A API trata falhas Oracle de forma isolada: indisponibilidade do banco **não** derruba o restante do Controle de Licenças.
