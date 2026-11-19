# Auditoria `zen-mayer` — G2: Varredura de travas e segurança

- **Data:** 2026-11-19
- **Branch / commit auditado:** `origin/pendente/zen-mayer-E1-E2` (ponta `fb6bf2a`, no worktree somente leitura `gemini-zen-mayer`)
- **Base de comparação:** `main` (`6b0ca36`, `git merge-base main origin/pendente/zen-mayer-E1-E2` = `8ea548b58bd9334af8ab6520117e056eb12b9e9e`)
- **Ambiente de execução:** Windows PowerShell usando `npx.cmd pnpm@12.11.2` em `C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini-zen-mayer`

---

## Tabela resumo

| # | Pergunta | Veredito |
|---|---|---|
| 1 | `typecheck`, `lint`, `test` e `format:check` passam? | `OK` |
| 2 | Há teste pulado ou focado novo? | `PARCIAL` |
| 3 | `domain/` importa I/O? | `OK` |
| 4 | Dinheiro em `float`? | `OK` |
| 5 | Banco usa `bigint` para valores? | `OK` |
| 6 | RLS ligado sem políticas? | `OK` |
| 7 | Segredo ou dado real versionado? | `PARCIAL` |
| 8 | Dependências mudaram? | `PROBLEMA` |
| 9 | Logs com dado sensível? | `OK` |
| 10 | Os arquivos `.claude/`, `CLAUDE.md` ou `.github/` mudaram? | `OK` |

---

## Item 1 — `typecheck`, `lint`, `test` e `format:check` passam?

**Comandos executados:**

```powershell
npx.cmd pnpm@12.11.2 typecheck
npx.cmd pnpm@12.11.2 lint
npx.cmd pnpm@12.11.2 test
npx.cmd pnpm@12.11.2 format:check
```

**Saída resumida e códigos de saída:**

- `npx.cmd pnpm@12.11.2 typecheck` (`tsc --noEmit && tsc --noEmit -p domain`): **exit 0**
- `npx.cmd pnpm@12.11.2 lint` (`eslint . --max-warnings=0`): **exit 0**
- `npx.cmd pnpm@12.11.2 test` (`vitest run`): **exit 0**
  - **Test Files:** `25 passed | 2 skipped (27)`
  - **Tests:** `1351 passed | 3 expected fail | 37 skipped (1391)`
  - Arquivos pulados (`2`): `tests/integration/migration.test.ts` (4 skipped) e `tests/qa/database-qa.test.ts` (32 skipped), além de 1 skipped em `tests/qa/domain-files-qa.test.ts` (19 tests | 1 skipped, já existente em `main`).
- `npx.cmd pnpm@12.11.2 format:check` (`prettier --check .`): **exit 0** ("All matched files use Prettier code style!")

**Análise:** Todos os 4 comandos obrigatórios passaram com código de saída 0. Os testes pulados e `expected fail` estão detalhados no Item 2.

**Veredito:** `OK`

---

## Item 2 — Há teste pulado ou focado novo?

**Comandos executados:**

```powershell
git diff -U3 main...origin/pendente/zen-mayer-E1-E2 -- tests/ | Select-String -Pattern '\.(skip|only|todo|fails)\b|\bx(it|describe)\(|skipIf' -Context 2,3
git grep -nE "\.(skip|only|todo|fails)\b|\bx(it|describe)\(" -- tests/
git grep -nE "skipIf|\.skip|\.only|\.todo|\.fails" -- tests/
```

**Saída resumida / evidências:**

1. **Testes focados (`.only`) ou `.todo` / `xit` / `xdescribe`:** **0 ocorrências** no diff nem em `tests/`.
2. **Testes pulados condicionalmente novos (`describe.skipIf(!url)`):**
   - `tests/integration/migration.test.ts:27`: `describe.skipIf(!url)('migração em Postgres real (requer TEST_DATABASE_URL)', ...)` — 4 testes pulados quando `TEST_DATABASE_URL` não está definida (exceção prevista no cartão `docs/tasks/E2/T2.2.md:32`).
   - `tests/qa/database-qa.test.ts:34`: `describe.skipIf(!url)('QA T2.2: schema, enums, FKs e RLS num Postgres real (requer TEST_DATABASE_URL)', ...)` — 32 testes pulados quando `TEST_DATABASE_URL` não está definida.
   - *(Observação)*: `tests/qa/domain-files-qa.test.ts` possui 1 teste pulado na execução, mas o arquivo não foi modificado na branch (`git diff main...origin/pendente/zen-mayer-E1-E2 -- tests/qa/domain-files-qa.test.ts` vazio).
3. **Novos `it.fails` (documentando falhas conhecidas de QA):**
   - `tests/qa/database-qa.test.ts:330`: `it.fails('RISCO-T2.2-QA-02: transação não aponta para conta de outro usuário (23503)', ...)` (dentro do `describe.skipIf(!url)`).
   - `tests/qa/spending-qa.test.ts:486`: `it.fails('BUG-T1.6-01: mesma lista [despesa -MAX, despesa -1, estorno +2] dá o mesmo resultado em qualquer ordem', ...)`.
   - *(Já existentes em `main`)*: `tests/qa/transactions-qa.test.ts:843` e `tests/qa/transactions-qa.test.ts:857`.

**Análise:** Não há nenhum `.only`, `.todo` ou `.skip` incondicional novo. Porém, a suíte possui 36 testes novos em `describe.skipIf(!url)` (que não rodaram neste ambiente por ausência de `TEST_DATABASE_URL`) e 2 novos `it.fails` documentando falhas ainda não corrigidas (`BUG-T1.6-01` e `RISCO-T2.2-QA-02`).

**Veredito:** `PARCIAL`

---

## Item 3 — `domain/` importa I/O?

**Comandos executados:**

```powershell
git grep -nE "from ['\"](node:|fs|path|crypto|drizzle|next|postgres)" -- domain/
git grep -n "fetch(" -- domain/
git grep -nE "\brequire\(|import\(" -- domain/
```

**Saída resumida / evidências:**

- Os três comandos retornaram **saída vazia** (0 ocorrências em `domain/`).

**Análise:** Nenhuma importação proibida de Node, banco, rede, Next.js, `fetch` ou `require`/import dinâmico foi encontrada em `domain/`. Confirmado também pelo `typecheck` específico (`tsc --noEmit -p domain`) e pelos testes de isolamento em `tests/lint/`.

**Veredito:** `OK`

---

## Item 4 — Dinheiro em `float`?

**Comandos executados:**

```powershell
git grep -nE "parseFloat|toFixed|Math\.round|\* ?100\b|/ ?100\b" -- domain/ lib/
git grep -nE "parseFloat|toFixed|Math\.(round|floor|ceil|trunc)|\* ?100\b|/ ?100\b" -- domain/ lib/ app/ components/
```

**Saída resumida / evidências:**

O primeiro comando retornou **1 ocorrência**; o segundo (expandido para `Math.floor/ceil/trunc` e `app/ components/`) retornou **3 ocorrências**, todas no mesmo trecho:

- `domain/dates/dates.ts:29`: `const era = Math.floor(y / 400);`
- `domain/dates/dates.ts:32`: `const dayOfYear = Math.floor((153 * shifted + 2) / 5) + day - 1;`
- `domain/dates/dates.ts:34`: `yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;`

**Justificativa por ocorrência:**

- `domain/dates/dates.ts:29, 32, 34` — **Não envolve dinheiro.** Trata-se da função `toDayNumber(year, month, day)` (`domain/dates/dates.ts:27-36`), que implementa aritmética de data civil proléptica (séculos de 400 e 100 anos e contagem de dias no ano) sem uso de `Date`.

**Veredito:** `OK`

---

## Item 5 — Banco usa `bigint` para valores?

**Arquivos inspecionados:**

- `lib/database/schema.ts`
- `drizzle/0000_schema_inicial.sql`
- `drizzle/0001_rls.sql`, `drizzle/0002_transactions_type_check.sql`, `drizzle/0003_transactions_type_currency.sql`

**Saída resumida / evidências:**

Em `lib/database/schema.ts:27`, o tipo monetário é definido como:

```ts
const money = (name: string) => bigint(name, { mode: 'bigint' });
```

*(Nota: usa explicitamente `mode: 'bigint'`, e não `mode: 'number'`.)*

Todas as colunas de valor monetário no schema TypeScript e nas migrações SQL são `bigint`:

| Tabela.Coluna | Schema Drizzle (`lib/database/schema.ts`) | Migração SQL (`drizzle/0000_schema_inicial.sql`) |
|---|---|---|
| `accounts.balance` | `lib/database/schema.ts:92` — `balance: money('balance')` | `drizzle/0000_schema_inicial.sql:10` — `"balance" bigint` |
| `accounts.available_balance` | `lib/database/schema.ts:93` — `availableBalance: money('available_balance')` | `drizzle/0000_schema_inicial.sql:11` — `"available_balance" bigint` |
| `accounts.reconciliation_diff` | `lib/database/schema.ts:97` — `reconciliationDiff: money('reconciliation_diff')` | `drizzle/0000_schema_inicial.sql:15` — `"reconciliation_diff" bigint` |
| `holdings.balance` | `lib/database/schema.ts:276` — `balance: money('balance').notNull()` | `drizzle/0000_schema_inicial.sql:56` — `"balance" bigint NOT NULL` |
| `import_items.parsed_amount` | `lib/database/schema.ts:247` — `parsedAmount: money('parsed_amount')` | `drizzle/0000_schema_inicial.sql:70` — `"parsed_amount" bigint` |
| `transactions.amount` | `lib/database/schema.ts:154` — `amount: money('amount').notNull()` | `drizzle/0000_schema_inicial.sql:141` — `"amount" bigint NOT NULL` |

**Análise:** Todas as 6 colunas monetárias usam `bigint` no PostgreSQL e `bigint(..., { mode: 'bigint' })` no Drizzle. Não há colunas `real`, `double precision`, `numeric` ou `money`.

**Veredito:** `OK`

---

## Item 6 — RLS ligado sem políticas?

**Comandos executados:**

```powershell
git grep -niE "enable row level security|create policy" -- drizzle/
git grep -n "CREATE TABLE" -- drizzle/
```

**Saída resumida / evidências:**

1. **Tabelas criadas (`11` em `drizzle/0000_schema_inicial.sql`):**
   - `accounts` (`:1`), `categories` (`:25`), `connections` (`:36`), `holdings` (`:49`), `import_items` (`:63`), `imports` (`:78`), `institutions` (`:96`), `merchant_rules` (`:106`), `sync_logs` (`:115`), `transactions` (`:130`), `users` (`:157`).
2. **`ENABLE ROW LEVEL SECURITY` (`11` em `drizzle/0001_rls.sql`):**
   - `users` (`:2`), `institutions` (`:6`), `connections` (`:10`), `accounts` (`:14`), `transactions` (`:18`), `categories` (`:22`), `merchant_rules` (`:26`), `imports` (`:30`), `import_items` (`:34`), `holdings` (`:38`), `sync_logs` (`:42`).
   - Cada uma dessas 11 tabelas também possui `FORCE ROW LEVEL SECURITY` nas linhas ímpares/pares subsequentes (`:4` a `:44`).
3. **`CREATE POLICY`:** **0 ocorrências** em `drizzle/`.

**Análise:** 100% das 11 tabelas criadas têm `ENABLE ROW LEVEL SECURITY` (e `FORCE ROW LEVEL SECURITY`) e 0 têm `CREATE POLICY`.

**Veredito:** `OK`

---

## Item 7 — Segredo ou dado real versionado?

**Comandos executados:**

```powershell
Get-Command gitleaks -ErrorAction SilentlyContinue
git diff main...origin/pendente/zen-mayer-E1-E2 --name-only | Select-String -Pattern '\.env|\.csv|\.xlsx|\.png|\.jpe?g|\.raw\.json|private/|credentials'
git diff main...origin/pendente/zen-mayer-E1-E2 -- ':(exclude)pnpm-lock.yaml' | Select-String -Pattern "AKIA|BEGIN[ A-Z]*PRIVATE KEY|postgres(ql)?://|sk_live|sk_test|eyJ[A-Za-z0-9_-]{10,}|ghp_|gho_|xoxb-|client_secret"
```

**Saída resumida / evidências:**

- `Get-Command gitleaks`: **vazio** (`gitleaks` não está instalado neste ambiente).
- Filtro por nomes de arquivos sensíveis (`\.env|\.csv|\.xlsx|\.png|\.jpe?g|\.raw\.json|private/|credentials`): **vazio** (0 arquivos suspeitos no diff).
- Varredura de conteúdo por padrões de segredo no diff (excluindo `pnpm-lock.yaml`): encontrou apenas exemplos fictícios locais de `postgres://` / `postgresql://`:
  - `README.md` (exemplo documentado local `127.0.0.1:5432` com marcador `<senha>`)
  - `docs/tasks/E2/T2.5.md` (comandos de teste local com `postgres://u:p@127.0.0.1:5432/db`)
  - `tests/integration/migration.test.ts` e `tests/qa/database-qa.test.ts` (fallback sintético `'postgresql://invalido'`)
  - Nenhum token (`AKIA`, `sk_*`, `eyJ*`, `ghp_*`, `xoxb-*`), chave privada ou credencial real encontrado.

**Análise:** Nenhum arquivo sensível ou segredo foi identificado na checagem alternativa por nome e por regex no diff. Contudo, como `gitleaks` não está instalado para varredura completa do histórico de commits, o item é marcado como parcial conforme instruído.

**Veredito:** `PARCIAL`

---

## Item 8 — Dependências mudaram?

**Comandos executados:**

```powershell
git diff main...origin/pendente/zen-mayer-E1-E2 -- package.json
git log --format="%h %s" main..origin/pendente/zen-mayer-E1-E2 -- package.json
```

**Saída resumida / evidências:**

Mudanças em `package.json`:

- **`scripts` adicionados:**
  - `"db:generate": "drizzle-kit generate"`
  - `"db:migrate": "drizzle-kit migrate"`
- **`devDependencies` adicionado:**
  - `"drizzle-kit": "^0.31.11"` (commit `4a2c417`)
- **`dependencies` adicionados:**
  - `"drizzle-orm": "^0.45.4"` (commit `4a2c417`)
  - `"postgres": "^4.1.1"` (commit `4a2c417`)
- **`dependencies` alterado:**
  - `"next": "^16.4.1"` → `"^16.4.6"` (commit `1a18c51`, `fix(E2/T2.1s): sobe o Next para 16.4.6 (correção de segurança)`)

**Conferência com `docs/decisoes/`:**

- **`drizzle-orm`, `postgres` e `drizzle-kit`:** **Têm ADR.** Estão explicitamente cobertos por `docs/decisoes/0021-banco-e2.md` (item 1: *"Dependências novas: `drizzle-orm` e `postgres` (postgres.js) em `dependencies`; `drizzle-kit` em `devDependencies`"*), com aprovação do dono registrada em 18/11/2026.
- **`next` (`^16.4.1` → `^16.4.6`):** **Não tem ADR própria nem emenda em `docs/decisoes/`.** O pacote `next` foi aprovado originalmente na `docs/decisoes/0019-base-do-app-e2.md`, e a atualização de patch de segurança tem cartão (`docs/tasks/E2/T2.1s.md`) registrando aprovação do dono em 18/11/2026, mas não foi registrada emenda na ADR-0019 nem nova ADR em `docs/decisoes/`.

**Análise:** Há uma dependência alterada (`next`) sem ADR dedicada ou emenda em `docs/decisoes/`, descumprindo literalmente a regra *"Mudança de dependência exige ADR em `docs/decisoes/`"* (`CLAUDE.md:12`), embora haja justificativa de patch de segurança e registro no cartão `T2.1s.md`.

**Veredito:** `PROBLEMA`

---

## Item 9 — Logs com dado sensível?

**Comandos executados:**

```powershell
git grep -nE "console\.(log|info|warn|error)" -- lib/ app/ domain/
git grep -nE "console\.(log|info|warn|error)" -- components/
git grep -nE "\blog\.(info|warn|error)\(" -- lib/ app/ domain/ components/
```

**Saída resumida / evidências:**

- `lib/log.ts:85`: `if (level === 'error') console.error(line);`
- `lib/log.ts:86`: `else console.log(line);`
- Em `app/`, `domain/` e `components/`: **0 ocorrências** de `console.*` ou chamadas a `log.(info|warn|error)`.

**Análise de `lib/log.ts:85-86`:** As únicas chamadas a `console.error` e `console.log` estão encapsuladas em `escreverNoConsole(line)` dentro de `lib/log.ts` (que já existia em `main`), onde `createLogger` (`lib/log.ts:63-80`) filtra os campos estritamente por lista de permitidos (`CHAVES_PERMITIDAS`: `requestId`, `accountId`, `importId`, `syncId`, `count`, `durationMs`, `code`, `status`, `source`, `stage`, `attempt`), limita strings a 64 caracteres e de objetos `Error` extrai apenas `error.name` e `error.code` (sem `message`, stack, valores monetários, descrições ou tokens).

**Veredito:** `OK`

---

## Item 10 — Os arquivos `.claude/`, `CLAUDE.md` ou `.github/` mudaram?

**Comandos executados:**

```powershell
git diff --stat main...origin/pendente/zen-mayer-E1-E2 -- .claude CLAUDE.md .github
git diff --stat main...origin/pendente/zen-mayer-E1-E2 -- .claude CLAUDE.md .github .agents GEMINI.md
```

**Saída resumida / evidências:**

- Ambos os comandos retornaram **saída vazia** (nenhum arquivo alterado em `.claude/`, `CLAUDE.md`, `.github/`, `.agents/` ou `GEMINI.md`).

**Veredito:** `OK`
