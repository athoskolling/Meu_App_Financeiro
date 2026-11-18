# 0021: Banco no E2 (Drizzle, driver e migrações)

- **Status:** aceita. Dependências aprovadas pelo dono em 18/11/2026 ("Aprovo as 3").
- **Estágio:** E2 (T2.2)
- **Spec:** 6, 10, 14

## Decisões

1. **Dependências novas:** `drizzle-orm` e `postgres` (postgres.js) em `dependencies`; `drizzle-kit` em `devDependencies`. As versões exatas ficam no relatório da T2.2 e no lockfile. O postgres.js aceita `prepare: false`, exigido pelo pooler do Supabase em modo transação (porta 6543, spec 6).
2. **Migrações SQL versionadas em `drizzle/`**, geradas pelo `drizzle-kit generate` e revisadas no diff. Nada de `drizzle-kit push` em produção: a migração aplicada é sempre o arquivo do Git.
3. **RLS ligado em toda tabela, sem políticas**, por SQL na própria migração (`ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`). Um teste estático confere que toda tabela criada tem RLS; a T2.8 prova contra um Postgres de verdade que `anon` não lê nada.
4. **Dinheiro é `bigint`** no banco, lido em modo `bigint` e convertido para `Cents` só por `fromDb` (ADR-0018).
5. **Chaves:** `uuid` com `gen_random_uuid()`; `user_id` em toda tabela de dados (spec 10); índice único `(account_id, identity_key)` e `identity_key` `NOT NULL`.
6. **Datas civis** (`date`, `period_start`, `period_end`) em coluna `date` lida em modo `string`, para nunca passar por `Date` (ADR-0018, item 5). Momentos (`created_at` etc.) em `timestamptz`.
7. **Conexão do app só no servidor**: `lib/database/client.ts` cria o cliente com `prepare: false` e não é importável pelo navegador.
