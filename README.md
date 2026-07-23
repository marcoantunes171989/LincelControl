# Gerador de Update — TAB_LOJA

Aplicação **exclusivamente front-end** que gera, em tempo real, um script SQL de `UPDATE` para a tabela `TAB_LOJA`, a partir dos dados da loja, da licença/PDVs e dos módulos selecionados.

Não existe back-end, API, banco de dados ou execução do SQL gerado. O script deve ser revisado e executado manualmente pela equipe responsável.

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

- Um cabeçalho comentado com o código e a descrição da loja (somente identificação, sem quebras de linha) e o CNPJ.
- Um `SET` com os 62 campos de módulos/integrações (na ordem do catálogo) seguidos dos campos de licença, PDVs e CNPJ.
- Uma cláusula `WHERE TAB_LOJA.COD_LOJA = <código>;`.

O campo **Descrição** é usado somente no comentário do cabeçalho — nunca é incluído no `SET`.

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

## Nenhuma informação é salva

A aplicação não utiliza `localStorage`, `sessionStorage`, `IndexedDB`, cookies, banco de dados ou qualquer chamada de rede para persistir dados. Todo o estado vive apenas na memória do React — ao atualizar a página, os valores retornam ao estado inicial de exemplo.

## Aviso

O script gerado **não é executado automaticamente**. Revise cuidadosamente todos os campos antes de rodar o `UPDATE` em qualquer banco de dados de produção.
