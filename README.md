# Gerador de Update — TAB_LOJA

Aplicação **exclusivamente front-end** que gera, em tempo real, um script SQL de `UPDATE` para a tabela `TAB_LOJA`, a partir dos dados da loja, da licença/PDVs e dos módulos selecionados.

Não existe back-end próprio, banco de dados ou execução do SQL gerado. A única chamada de rede é a consulta pública de Inscrição Estadual pelo CNPJ (veja [Consulta de Inscrição Estadual](#consulta-de-inscrição-estadual)). O script deve ser revisado e executado manualmente pela equipe responsável.

## Tecnologias utilizadas

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Hook Form / Zod (disponíveis para validação de formulários)
- Vitest + Testing Library (testes unitários)
- lucide-react (ícones)
- APIs nativas do navegador: `navigator.clipboard`, `Blob`, `URL.createObjectURL`

## Como instalar

```bash
npm install
```

## Como executar em desenvolvimento

```bash
npm run dev
```

## Como executar os testes

```bash
npm run test
```

## Como gerar o build de produção

```bash
npm run build
```

## Como funciona a geração do SQL

Toda alteração em qualquer campo — dados da loja, licença/PDVs, módulos ou modalidade NF-e Expert — recalcula o script `UPDATE TAB_LOJA` instantaneamente (`src/utils/sqlGenerator.ts`), sem necessidade de um botão "Gerar". O script é composto por:

- Um cabeçalho comentado com o código e a descrição da loja (somente identificação, sem quebras de linha), o CNPJ e a Inscrição Estadual.
- Um `SET` com os 62 campos de módulos/integrações (na ordem do catálogo) seguidos dos campos de licença, PDVs e CNPJ.
- Uma cláusula `WHERE TAB_LOJA.COD_LOJA = <código>;`.

Os campos **Descrição** e **Inscrição Estadual** são usados somente no comentário do cabeçalho — nunca são incluídos no `SET` (não existe coluna correspondente na TAB_LOJA).

## Consulta de Inscrição Estadual

Ao completar os 14 dígitos do CNPJ, a aplicação consulta automaticamente a API pública [CNPJ.ws](https://publica.cnpj.ws/) (`GET https://publica.cnpj.ws/cnpj/<cnpj>`) para localizar a(s) Inscrição(ões) Estadual(is) da empresa (`src/utils/cnpjLookup.ts`). O campo na tela é somente leitura:

- Enquanto consulta: exibe "Consultando...".
- Encontrada: exibe `UF: número` (múltiplas inscrições são separadas por `|`).
- Não encontrada ou falha na consulta: exibe **ISENTO**.

Essa é a única chamada de rede da aplicação — envia apenas o CNPJ digitado (informação pública) para a API de consulta, sem enviar código da loja, licença ou o script gerado.

## Regra de módulos S/N

Os 62 módulos/integrações do catálogo (`src/data/modules.ts`, seções **Módulo** e **Integração**) **sempre** aparecem no `SET`, nunca são omitidos:

- Módulo selecionado → `'S'`
- Módulo desmarcado → `'N'`

Isso evita que um módulo antes habilitado permaneça ativo no banco por esquecimento.

## Regra de exclusividade NF-e Expert

Os campos `mod_gestor_doc_fisc` (Embedded) e `MOD_NFE` (Partner) são mutuamente exclusivos e controlados por um seletor único ("Modalidade NF-e Expert"), nunca por checkboxes independentes:

| Modalidade | mod_gestor_doc_fisc | MOD_NFE |
| ---------- | -------------------- | ------- |
| Nenhuma    | `N`                   | `N`     |
| Embedded   | `S`                   | `N`     |
| Partner    | `N`                   | `S`     |

> O nome físico da coluna no banco é `mod_gestor_doc_fisc` (minúsculo), mas o script SQL gerado sempre exibe os nomes de campo em maiúsculas — SQL é case-insensitive para identificadores, então o `UPDATE` continua correto.

## Nenhuma informação é salva

A aplicação não utiliza `localStorage`, `sessionStorage`, `IndexedDB`, cookies ou banco de dados para persistir dados. Todo o estado vive apenas na memória do React — ao atualizar a página, os valores retornam ao estado inicial em branco. A única exceção é a consulta de Inscrição Estadual descrita acima, que envia o CNPJ para a API pública CNPJ.ws e não persiste nada além do resultado em memória.

## Aviso

O script gerado **não é executado automaticamente**. Revise cuidadosamente todos os campos antes de rodar o `UPDATE` em qualquer banco de dados de produção.
