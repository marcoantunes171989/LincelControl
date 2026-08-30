# LicenControl — Controle de Licenças

Aplicação para geração de scripts `UPDATE TAB_LOJA` com integração opcional
com o Oracle Database do cliente, incluindo aplicação direta e segura da
licença (preview → confirmação → transação → commit/rollback).

## Arquitetura

```text
Frontend (React + Vite)
        |
        v
LicenControl Oracle Agent (Node.js + Express)   ← pasta server/
        |
        v
node-oracledb Thin Mode (sem Instant Client / OCI.DLL)
        |
        v
Oracle Database do cliente (rede local/privada)
```

O navegador **nunca** se conecta diretamente ao Oracle. O driver usado é o
**node-oracledb Thin Mode**: não é necessário instalar Oracle Instant Client
nem `OCI.DLL` para o fluxo principal (importar TNS, logon, consultar,
aplicar licença). Toda credencial, caminho sensível e SQL de gravação ficam
no backend (`server/`) — o "LicenControl Oracle Agent".

O Oracle do cliente normalmente está em uma rede privada (ex.: `192.168.0.238`),
inacessível a partir da internet. Por isso o Agent roda **na máquina
conectada a essa rede**, nunca como Function da Vercel.

## Tecnologias

| Camada | Stack |
|--------|--------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, Vitest |
| Backend | Node.js 18+, Express 5, `oracledb` (Thin Mode), Zod, Helmet, CORS, rate-limit |
| Persistência de config | JSON (`server/data/oracle_connection_settings.json`) — **sem senha** |

## Pré-requisitos

- Node.js **18+** (recomendado 20 LTS)
- Um arquivo `tnsnames.ora` do cliente (importado pela UI, não precisa estar
  em disco previamente)
- Rede alcançando o HOST:PORT do Oracle a partir da máquina onde o Agent roda

### Oracle Instant Client / OCI.DLL — NÃO são obrigatórios

O projeto usa o **node-oracledb Thin Mode**, que é 100% JavaScript e conecta
via Easy Connect (`host:port/service_name`) sem depender de bibliotecas
nativas do Oracle. Você **não precisa** instalar Instant Client nem
configurar `OCI.DLL`/`ORACLE_CLIENT_LIB_DIR` para usar o produto.

As variáveis `ORACLE_CLIENT_LIB_DIR` e `ORACLE_TNSPING_PATH` (veja
`.env.example`) existem apenas como **diagnóstico opcional**: se você tiver
`tnsping.exe` disponível, o Agent o usa como checagem extra de rede durante a
validação — mas a etapa é sempre marcada como "ignorada" (skipped) quando o
executável não é encontrado, sem bloquear login algum.

## Instalação

```bash
npm install
npm install --prefix server
```

Copie o exemplo de ambiente:

```bash
cp .env.example .env
```

Na prática, os únicos ajustes normalmente necessários são:

- `ADMIN_API_KEY` (obrigatório em produção; em desenvolvimento pode ficar vazio)
- `CORS_ORIGIN` (se o frontend não rodar em `http://localhost:5173`)

Tudo relacionado a TNS/HOST/PORT/SERVICE é resolvido pela própria UI, ao
importar o `tnsnames.ora` — nenhuma variável de ambiente é obrigatória para
isso.

## Execução local

Terminal 1 — Agent Oracle (API local):

```bash
npm run oracle:agent
```

(equivalente a `npm run dev:server`)

Terminal 2 — Frontend:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Agent: `http://127.0.0.1:8787` (bind local por padrão — ver [Segurança](#segurança))
- Em desenvolvimento, o Vite faz proxy de `/api` → `8787`

Produção do Agent:

```bash
npm run oracle:agent:build
npm run oracle:agent:start
```

No Windows, para quem prefere um atalho sem terminal: `scripts\start-oracle-agent.cmd`
(verifica se o Node está instalado, instala dependências se faltarem, inicia
o Agent e mantém a janela aberta se der erro).

## Fluxo completo: TNS → logon → Gerador SQL → Aplicar

```text
1. Integração Oracle → Importar tnsnames.ora
   → alias, HOST, PORT, SERVICE_NAME/SID identificados automaticamente
2. Selecionar o alias (Database) → Username → Password → OK
   → o Agent testa a conexão (SELECT 1 FROM DUAL) e cria o pool
3. Gerador SQL → preencher loja, licença e módulos (funciona 100% offline)
4. Botão "Aplicar" (barra lateral, ao lado de Copiar/Baixar)
   → desabilitado se o formulário for inválido, se o Oracle estiver
     desconectado, ou durante uma operação em andamento
5. Preview (POST /api/oracle/license-update/preview)
   → consulta a TAB_LOJA pelo COD_LOJA, confere o CNPJ e retorna
     SOMENTE os campos que realmente vão mudar
6. Modal de confirmação
   → mostra loja, banco (alias/host/porta/service/usuário) e a tabela
     CAMPO / ATUAL / NOVO — nada é aplicado sem um clique explícito em
     "Aplicar atualização"
7. Apply (POST /api/oracle/license-update/apply)
   → uma única conexão, SELECT ... FOR UPDATE NOWAIT, revalida COD_LOJA e
     CNPJ, executa um UPDATE parametrizado, confere rowsAffected === 1,
     faz um SELECT de conferência e só então COMMIT
   → qualquer inconsistência em qualquer etapa faz ROLLBACK automático
8. Resumo do resultado (toast + painel "Ver detalhes")
```

O Gerador SQL continua funcionando **totalmente offline** (copiar/baixar o
`.sql`) mesmo sem o Agent rodando — são dois modos independentes:

- **Modo manual**: gerar/copiar/baixar o script `.sql` (sempre disponível).
- **Modo conectado**: aplicar diretamente no Oracle via o botão "Aplicar"
  (exige o Agent local rodando e conectado).

### Por que não existe um endpoint de "executar SQL"

O texto exibido em **Pré-visualização do script** é só para leitura, cópia e
download — ele nunca é enviado ao Agent para execução. A atualização da
`TAB_LOJA` usa dois endpoints dedicados
(`/api/oracle/license-update/preview` e `/api/oracle/license-update/apply`)
que montam o `UPDATE` no backend a partir de uma **whitelist interna de
colunas** (`server/src/oracle/licenseFields.ts`, espelhando exatamente os
módulos de `src/data/modules.ts` e os campos de licença de
`src/utils/sqlGenerator.ts`) e de **binds Oracle** — nunca concatenação de
texto. Não existe, e não deve ser criado, um `POST /api/oracle/execute-sql`
genérico (`ORACLE_ALLOW_RAW_SQL` permanece `false`).

## Integração Oracle (UI)

1. Abra **Integração Oracle** na navegação superior
2. Clique em **Importar tnsnames.ora** e selecione o arquivo do cliente
3. Selecione o alias (Database); HOST/PORT/SERVICE_NAME são extraídos
   automaticamente e exibidos abaixo do campo
4. Informe Username e Password
5. Clique em **OK** — o Agent testa a conexão, executa `SELECT 1 FROM DUAL`,
   lê informações da sessão e cria/reutiliza o pool
6. O card de sessão mostra Alias, Host, Porta, Service, Usuário e "Pronto
   para aplicar atualizações da TAB_LOJA" assim que o pool estiver conectado

Ao desconectar:

- o pool é fechado
- as configurações não sensíveis permanecem salvas
- a senha **nunca é gravada em disco** — fica só em memória no processo do
  Agent enquanto ele estiver rodando; após reiniciar o Agent, a senha
  precisa ser informada novamente

### Estados

Não configurado · Validando · Conectando · Conectado · Desconectando ·
Desconectado · Erro · Senha necessária · Oracle Client indisponível · TNS
indisponível · Banco inacessível

## Endpoints internos

Todos sob `/api/oracle` (exceto health geral em `/api/health`).

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/api/oracle/health` | `oracle.view_status` |
| GET | `/api/oracle/status` | `oracle.view_status` |
| GET/POST | `/api/oracle/configuration` | `oracle.configure` |
| POST | `/api/oracle/tns-admin` | `oracle.configure` |
| GET/POST | `/api/oracle/tns-aliases` | `oracle.configure` |
| POST | `/api/oracle/tns-parse` | `oracle.configure` |
| POST | `/api/oracle/tns-import` | `oracle.configure` |
| POST | `/api/oracle/validate-client` | `oracle.validate` |
| POST | `/api/oracle/validate` | `oracle.validate` |
| POST | `/api/oracle/connect` | `oracle.connect` |
| POST | `/api/oracle/disconnect` | `oracle.disconnect` |
| POST | `/api/oracle/toggle` | connect + disconnect |
| GET | `/api/oracle/queries` | `oracle.query_dashboard` |
| POST | `/api/oracle/query` | `oracle.query_dashboard` |
| POST | `/api/oracle/license-update/preview` | `oracle.apply_license` |
| POST | `/api/oracle/license-update/apply` | `oracle.apply_license` |

Autenticação: header `X-Admin-Api-Key` (ou `Authorization: Bearer <key>`). Em
desenvolvimento, se `ADMIN_API_KEY` estiver vazia, o acesso local é liberado
com permissões de admin.

`oracle.apply_license` é uma permissão **somente admin** — o papel `viewer`
não a possui, então não consegue nem pré-visualizar nem aplicar alterações na
`TAB_LOJA` (o preview já revela dados operacionais da base).

A senha **nunca** é retornada nas respostas nem gravada em log.

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

Não invente nomes de tabelas do cliente. Só adicione após mapear o schema
real. SQL livre do frontend permanece desabilitado (`ORACLE_ALLOW_RAW_SQL=false`).

## Segurança

- Senha Oracle somente em memória no processo do Agent — nunca em
  `localStorage`, `sessionStorage`, URL, query string, `console.log`, arquivo
  JSON ou `.env` gerado automaticamente
- Configuração persistida sem senha (`server/data/oracle_connection_settings.json`)
- Bind local por padrão: o Agent escuta em `127.0.0.1` (não `0.0.0.0`), a
  menos que `ORACLE_AGENT_HOST` seja alterado explicitamente — a porta 1521
  do Oracle nunca é exposta à internet pelo LicenControl
- Rate limit nas rotas de validação/conexão/aplicação de licença
- Proteção contra tentativas repetidas de senha
- Atualização da TAB_LOJA restrita a `oracle.apply_license` (somente admin),
  com whitelist de colunas, binds parametrizados, transação única com
  `SELECT ... FOR UPDATE`, verificação pós-UPDATE e COMMIT/ROLLBACK
  automáticos (nunca `autoCommit: true` nessa operação)
- Proteção contra clique duplo/dupla submissão: trava em memória por
  `COD_LOJA` enquanto uma aplicação está em andamento
- `previewToken` assinado (HMAC) com expiração curta, garantindo que o Apply
  usa o mesmo snapshot validado no Preview; o backend sempre revalida a loja
  dentro da própria transação antes do UPDATE
- Helmet + CORS restrito
- Erros sanitizados (sem stack trace em produção)
- Logs estruturados com mascaramento de segredos (senha, CNPJ mascarado)
- Usuário Oracle recomendado: `CREATE SESSION` + `SELECT`/`UPDATE` apenas em
  `TAB_LOJA` (o mínimo necessário)

## Diagnóstico de erros comuns

| Código | Significado |
|--------|-------------|
| ORA-01017 | Usuário/senha inválidos |
| ORA-12154 | Alias TNS não resolvido |
| ORA-12514 | SERVICE_NAME desconhecido no listener |
| ORA-12541 | Listener indisponível |
| ORA-00054 | Registro em uso por outra operação (lock) — tente novamente |
| ORA-28000 | Conta bloqueada |
| ORA-28001 | Senha expirada |
| DPI-1047 | (legado — só ocorre se algo forçar Thick Mode; não deveria aparecer neste projeto) |

Mensagens de "Loja não encontrada", "CNPJ divergente", "Nenhuma alteração
necessária" e afins aparecem no preview/modal da aplicação de licença — nunca
como stack trace.

## Vercel

O frontend pode continuar hospedado na Vercel normalmente
(`vercel.json` faz build + rewrites de SPA). A Function stub em
`api/oracle/[...path].js` só existe para responder JSON claro (em vez de
HTML 200 de fallback) quando o frontend está publicado sem um Agent local —
ela **não conecta no Oracle real** e nunca deve tentar alcançar o IP privado
do cliente.

Quando o frontend detecta esse stub (`hostMode: "vercel-stub"`), o botão
**Aplicar** não tenta gravar nada e mostra:

> "Agente Oracle local não encontrado. Inicie o agente LicenControl na
> máquina conectada à rede do cliente."

O fluxo suportado para aplicar licenças de verdade é sempre **Agent + frontend
rodando na mesma rede do cliente** (local ou VPN) — não gambiarras para
contornar mixed content/Private Network Access do navegador.

Nunca coloque credencial Oracle em variáveis `VITE_*`: qualquer `VITE_*` é
embutida no bundle do navegador e é pública.

## Gerador SQL (funcionalidade original)

A aba **Gerador SQL** continua funcionando 100% offline para montar o
`UPDATE TAB_LOJA` (copiar, baixar `.sql`, restaurar exemplo, limpar
formulário). Isso não muda com a aplicação direta via Oracle — são dois
fluxos independentes (ver [seção acima](#fluxo-completo-tns--logon--gerador-sql--aplicar)).

## Scripts

```bash
npm run dev              # frontend
npm run oracle:agent     # Agent Oracle local (API), = npm run dev:server
npm run test             # testes web + server
npm run lint             # oxlint web + server
npm run build             # build web + server
```

## Roteiro de homologação manual

Use um `tnsnames.ora` de homologação real (ex.: alias `ORCL`, HOST
`192.168.0.238`, PORT `1521`, SERVICE_NAME `orcl.intersoul`) e um usuário
Oracle de teste.

1. Importar o `tnsnames.ora` → arquivo aceito sem erros
2. Alias esperado (ex. `ORCL`) aparece na lista e é selecionável
3. Informar Username/Password válidos
4. Clicar OK → status muda para "Conectado"
5. Preencher o Gerador SQL (loja, licença, módulos)
6. Botão **Aplicar** fica habilitado
7. Clicar Aplicar → preview mostra os campos que realmente vão mudar
8. Clicar **Cancelar** no modal → nada é alterado no Oracle
9. Clicar Aplicar de novo → confirmar → exatamente 1 registro da `TAB_LOJA`
   é atualizado (COMMIT); toast + painel de resultado exibidos
10. Consultar a loja no Oracle (fora do LicenControl) → valores conferem com
    o que foi aplicado
11. Em nenhum momento a senha aparece na tela, no console, no `localStorage`
    ou nos logs do Agent
12. Desconectar o Oracle na tela de Integração → botão **Aplicar** volta a
    ficar desabilitado, com a orientação "Conecte ao Oracle antes de
    aplicar."

**Importante**: os testes automatizados (`npm test`, CI, build, deploy na
Vercel) **nunca** tentam conectar em um Oracle real — todo teste de
integração com o Oracle usa mocks do driver `oracledb`. Uma conexão real só
acontece quando um operador humano importa o TNS, informa usuário/senha,
clica OK e depois clica em Aplicar + confirma explicitamente no modal.

## Desativar a integração Oracle

1. Desligue o interruptor na UI, ou
2. Não inicie o Agent (`server/`), ou
3. Simplesmente não importe nenhum TNS/credencial

A API trata falhas Oracle de forma isolada: indisponibilidade do banco
**não** derruba o restante do Controle de Licenças, e o Gerador SQL continua
funcionando no modo manual.
