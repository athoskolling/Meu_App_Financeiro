# 0027 — Banco de dados no E2: dependências Drizzle, driver `postgres.js`, schema do MVP, RLS e `DATABASE_URL_MIGRATIONS`

- **Status:** proposta (aguarda aprovação do dono — Issue #44)
- **Estágio:** E2 (T2.2), gate G3 (ADR-0030); caminhos em `src/` por camada (ADR-0029)
- **Spec:** `docs/spec/Meu_financeiro.md`, seções 5.1, 5.4, 6, 10 e 14
- **Complementa:** ADR-0009 (Drizzle no servidor, pooler 6543 com `prepare: false`, RLS sem políticas) e ADR-0019 (dependências novas exigem ok explícito do dono; variáveis obrigatórias por etapa)

## Contexto

Para executar a **T2.2** (schema Drizzle, migrações das 11 tabelas do MVP, RLS sem políticas e índice único `(account_id, identity_key)`), precisamos:

1. Aprovar formalmente as novas dependências de banco e migração antes de alterar `package.json` e `pnpm-lock.yaml` (ADR-0019 item 1 e ADR-0025).
2. Fixar o driver PostgreSQL compatível com o pooler transacional do Supabase (porta 6543, `prepare: false`) e com `bigint` seguro para a borda `fromDb` de `src/domain/money/`.
3. Formalizar como o RLS sem políticas entra nas migrações versionadas em `drizzle/` para que toda tabela nasça fechada desde a primeira migração.
4. Tornar `DATABASE_URL_MIGRATIONS` obrigatória em `src/infrastructure/env.ts` (conforme previsto na ADR-0019 item 3).

## Decisão (proposta)

### 1. Dependências novas (versões estáveis conferidas em 26/11/2026 via `pnpm view`)

| Pacote | Tipo | Versão estável | Motivo |
| --- | --- | --- | --- |
| `drizzle-orm` | `dependencies` | `^0.45.4` | ORM tipado somente no servidor (spec 6 / ADR-0009) |
| `postgres` (`postgres.js`) | `dependencies` | `^4.1.1` | Driver PostgreSQL oficial recomendado pela Drizzle para Supabase Transaction Pooler (suporta `prepare: false` nativamente, sem binários nativos) |
| `drizzle-kit` | `devDependencies` | `^0.31.11` | Geração e execução de migrações SQL versionadas em `drizzle/` |

- Nenhuma outra dependência (nem `@supabase/supabase-js`, que fica para avaliação na T2.4) entra neste passo.
- **Execução:** somente após o dono aprovar esta ADR, as dependências e o arquivo `drizzle.config.ts` entram em `package.json` / `pnpm-lock.yaml` via branch `cto/` antes do início do código da T2.2 (ADR-0025).

### 2. Conexões: app (6543) vs migrações (5432)

- **Aplicação (`src/infrastructure/database/client.ts`):** conecta usando `env().DATABASE_URL` com `postgres(url, { prepare: false })`, obrigatório no pooler em modo transação (porta 6543) do Supabase. Somente no servidor.
- **Migrações (`drizzle.config.ts` e runner de migração):** usa `DATABASE_URL_MIGRATIONS` (porta 5432, pooler em modo sessão no Supabase ou Postgres local em Docker `127.0.0.1:5432`).
- **`src/infrastructure/env.ts`:** `DATABASE_URL_MIGRATIONS` deixa de ser opcional e passa a **obrigatória** (URL `postgres://` ou `postgresql://`), mantendo o padrão de falha rápida sem vazar valores (ADR-0019).

### 3. Schema do MVP e dinheiro em `bigint`

- As **11 tabelas do MVP** da spec seção 10 entram no schema em `src/infrastructure/database/schema.ts`:
  1. `users`
  2. `institutions`
  3. `connections`
  4. `accounts`
  5. `transactions`
  6. `categories`
  7. `merchant_rules`
  8. `imports`
  9. `import_items`
  10. `holdings`
  11. `sync_logs`
- Todas as tabelas de dados carregam `user_id` referenciando `users.id`.
- **Dinheiro:** todas as colunas monetárias (`accounts.balance`, `accounts.available_balance`, `accounts.reconciliation_diff`, `transactions.amount`, `import_items.parsed_amount`, `holdings.balance`) usam `bigint({ mode: 'bigint' })` (ou `bigint` inteiro em centavos, nunca `numeric`, `real`, `double precision` nem `float`). Na borda com o domínio, a conversão para `Cents` passa sempre por `fromDb` de `src/domain/money/`.
- **Datas civis:** `transactions.date`, `transactions.posted_at`, `imports.period_start`, `imports.period_end` e `import_items.parsed_date` usam `date(..., { mode: 'string' })` (`YYYY-MM-DD`, ADR-0003/ADR-0018). Timestamps de auditoria/sync usam `timestamp(..., { withTimezone: true })` em UTC.
- **Identidade e dedup:** `transactions.identity_key` é `NOT NULL`, com índice único `UNIQUE (account_id, identity_key)` (garantia final de deduplicação, ADR-0004/ADR-0022). `transactions.deleted_at` implementa exclusão lógica.
- **Segredos em colunas:** `connections.external_item_id` recebe comentário explícito lembrando que valores reais devem ser gravados criptografados (E3) e nunca logados.

### 4. RLS ligado sem políticas em todas as tabelas

- Toda tabela criada pela migração inicial recebe explicitamente:
  ```sql
  ALTER TABLE "<tabela>" ENABLE ROW LEVEL SECURITY;
  ```
- **Nenhuma política `CREATE POLICY` é criada.** Como o Supabase expõe a API REST para as roles `anon` e `authenticated`, isso bloqueia 100% do acesso externo pelo navegador; apenas o servidor (conectando via role privilegiada do Postgres na `DATABASE_URL`) lê e grava dados.
- Um teste de integração na T2.2 (e aprofundado na T2.8) contra o Postgres local em Docker cria/usa uma role sem `BYPASSRLS` e comprova que `SELECT` e `INSERT` falham/retornam vazio em todas as 11 tabelas.

### 5. Pendência da T2.1 (Docker)

- Conforme registrado em `docs/equipes/GUIA_ATE_V1.md` e `docs/tasks/E2/T2.1.md`, a verificação de `docker compose up -d postgres` ficou aberta na T2.1 por indisponibilidade do daemon local. A T2.2 fecha formalmente essa verificação rodando `docker compose up -d postgres`, aplicando a migração do zero e executando os testes contra o Postgres 17.11 em Docker.

## Consequências

- A T2.2 só começa após o dono aprovar esta ADR + o cartão `docs/tasks/E2/T2.2.md` e após a entrada das dependências na `main` (via PR `cto/`).
- O `pnpm build` e os testes unitários que chamam `loadEnv` precisam incluir `DATABASE_URL_MIGRATIONS` quando usarem o conjunto mínimo obrigatório (o cartão da T2.2 inclui a atualização de `tests/infrastructure/env.test.ts`).
- `src/domain/` permanece 100% isolado (ADR-0017), e `src/application/` também não importa o Drizzle (ADR-0029): o Drizzle mora exclusivamente em `src/infrastructure/database/` e `drizzle/`.

## Aprovação do dono

- [ ] Aprovo as dependências (`drizzle-orm`, `postgres`, `drizzle-kit`) e as decisões dos itens 1 a 5 desta ADR.
