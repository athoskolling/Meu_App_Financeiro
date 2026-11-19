# G1 — Inventário dos 63 commits da branch `origin/pendente/zen-mayer-E1-E2`

- **Data:** 2026-11-19
- **Branch alvo:** `origin/pendente/zen-mayer-E1-E2`
- **Ponta:** `fb6bf2a` (`fb6bf2adc953b586de64e8863abfe5ec94fd9fdd`)
- **Merge-base com `main`:** `8ea548b` (`8ea548b58bd9334af8ab6520117e056eb12b9e9e`)
- **Contagem (`git rev-list --count main..origin/pendente/zen-mayer-E1-E2`):** `63`

## Comandos de verificação

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" rev-parse main origin/main origin/pendente/zen-mayer-E1-E2
```
Saída:
```text
6b0ca365a76117791ea386ff9127b3518719ceea
6b0ca365a76117791ea386ff9127b3518719ceea
fb6bf2adc953b586de64e8863abfe5ec94fd9fdd
```

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" merge-base main origin/pendente/zen-mayer-E1-E2
```
Saída:
```text
8ea548b58bd9334af8ab6520117e056eb12b9e9e
```

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" rev-list --count main..origin/pendente/zen-mayer-E1-E2
```
Saída:
```text
63
```

---

## Tabela cronológica completa (63 commits)

Notas factuais sobre a classificação:
- **Ordem:** obtida com `git log --reverse --format="%h|%ad|%an|%s" --date=short main..origin/pendente/zen-mayer-E1-E2`.
- **Tipo `chore`:** o commit nº 22 (`c78d21d`) usa o prefixo convencional exato `chore` (`chore(E2/T2.2): exceção no .gitignore...`).
- **Commits de merge:** commits com 2 pais em `git log -1 --format="%P" <hash>` recebem `tipo = merge`, e seus `arquivos tocados` listam a saída exata de `git diff --name-only <pai1> <hash>`.
- **Áreas:** `README.md` e `CHANGELOG.md` na raiz foram classificados em `docs`; `.gitignore`, `next-env.d.ts`, `pnpm-workspace.yaml`, `drizzle.config.ts`, `package.json` e `pnpm-lock.yaml` foram classificados em `config`. Não há outros diretórios fora de `domain`, `lib`, `drizzle`, `app`, `components`, `tests`, `docs` e `config`.
- **Tarefas em nomes de branch:** nos merges nº 52 (`agent/T1.7b-backend`) e nº 61 (`agent/T2.2b-backend`), os identificadores foram registrados como `T1.7` e `T2.2, T2.1s`, respectivamente.

| nº | hash | data | tarefa | tipo | arquivos tocados | áreas |
|---|---|---|---|---|---|---|
| 1 | `694310a` | 2026-11-18 | T1.3, T2.5, T2.10 | docs | `docs/tasks/E1/T1.3.md`, `docs/tasks/E2/T2.10.md`, `docs/tasks/E2/T2.5.md` | docs |
| 2 | `8148e59` | 2026-11-18 | T1.3 | test | `tests/domain/transactions/identity.test.ts` | tests |
| 3 | `6c9de9a` | 2026-11-18 | T1.3 | feat | `docs/tasks/E1/T1.3.md`, `domain/transactions/identity.ts`, `domain/transactions/index.ts` | domain, docs |
| 4 | `a4799f8` | 2026-11-18 | T1.5 | docs | `docs/decisoes/0020-regras-e1-parte-b.md`, `docs/tasks/E1/T1.5.md` | docs |
| 5 | `73e02ff` | 2026-11-18 | T2.5 | feat | `app/(app)/contas/page.tsx`, `app/(app)/enviar/page.tsx`, `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/transacoes/page.tsx`, `app/entrar/page.tsx`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/marca.tsx`, `components/navegacao-principal.tsx`, `components/pagina-vazia.tsx`, `docs/tasks/E2/T2.5.md` | app, components, docs |
| 6 | `d08abef` | 2026-11-18 | T2.10 | docs | `README.md`, `docs/tasks/E2/T2.10.md` | docs |
| 7 | `a266bb7` | 2026-11-18 | T1.5, T1.6, T1.8, T2.2 | docs | `docs/decisoes/0020-regras-e1-parte-b.md`, `docs/decisoes/0021-banco-e2.md`, `docs/decisoes/README.md`, `docs/tasks/E1/T1.5.md`, `docs/tasks/E1/T1.6.md`, `docs/tasks/E1/T1.8.md`, `docs/tasks/E2/T2.2.md` | docs |
| 8 | `2422e93` | 2026-11-18 | T1.6 | test | `tests/domain/dates/dates.test.ts`, `tests/domain/reports/spending.test.ts` | tests |
| 9 | `d41572f` | 2026-11-18 | T2.1s | docs | `docs/tasks/E2/T2.1s.md` | docs |
| 10 | `8122c1a` | 2026-11-18 | T1.6 | feat | `docs/tasks/E1/T1.6.md`, `domain/dates/dates.ts`, `domain/dates/index.ts`, `domain/reports/index.ts`, `domain/reports/spending.ts` | domain, docs |
| 11 | `37c98cc` | 2026-11-18 | T1.3 | test | `tests/qa/identity-qa.test.ts` | tests |
| 12 | `6c51cd8` | 2026-11-18 | T1.8 | merge | `docs/decisoes/0020-regras-e1-parte-b.md`, `docs/decisoes/0021-banco-e2.md`, `docs/decisoes/README.md`, `docs/tasks/E1/T1.5.md`, `docs/tasks/E1/T1.6.md`, `docs/tasks/E1/T1.8.md`, `docs/tasks/E2/T2.1s.md`, `docs/tasks/E2/T2.2.md` | docs |
| 13 | `a76a82d` | 2026-11-18 | T1.3 | docs | `docs/tasks/E1/T1.3.md` | docs |
| 14 | `7dc1302` | 2026-11-18 | T1.8 | test | `tests/domain/categories/categorize.test.ts` | tests |
| 15 | `4a2c417` | 2026-11-18 | T2.2 | feat | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | config |
| 16 | `48d7b1a` | 2026-11-18 | T2.2 | feat | `drizzle.config.ts`, `drizzle/meta/0000_snapshot.json`, `drizzle/meta/0001_snapshot.json`, `drizzle/meta/_journal.json`, `lib/database/client.ts`, `lib/database/schema.ts` | lib, drizzle, config |
| 17 | `8660028` | 2026-11-18 | T2.2 | feat | `tests/integration/migration.test.ts`, `tests/lib/database/schema.test.ts` | tests |
| 18 | `ae9b474` | 2026-11-18 | T2.2 | docs | `docs/tasks/E2/T2.2.md` | docs |
| 19 | `6af3420` | 2026-11-18 | T1.3 | fix | `docs/tasks/E1/T1.3.md`, `domain/transactions/identity.ts`, `tests/qa/identity-qa.test.ts` | domain, tests, docs |
| 20 | `6a31ab7` | 2026-11-18 | T2.2 | feat | `drizzle/0000_schema_inicial.sql`, `drizzle/0001_rls.sql` | drizzle |
| 21 | `9369800` | 2026-11-18 | T1.8 | feat | `docs/tasks/E1/T1.8.md`, `domain/categories/categorize.ts`, `domain/categories/index.ts` | domain, docs |
| 22 | `c78d21d` | 2026-11-18 | T2.2 | chore | `.gitignore` | config |
| 23 | `d5303ee` | 2026-11-18 | T2.1s | merge | `.gitignore`, `docs/tasks/E2/T2.1s.md` | docs, config |
| 24 | `8e71d83` | 2026-11-18 | T2.2 | merge | `.gitignore`, `docs/tasks/E2/T2.1s.md` | docs, config |
| 25 | `d3b0ac4` | 2026-11-18 | T2.5 | test | `docs/tasks/E2/T2.5.md` | docs |
| 26 | `1a18c51` | 2026-11-18 | T2.1s | fix | `package.json`, `pnpm-lock.yaml` | config |
| 27 | `766aff5` | 2026-11-18 | T2.1s | docs | `docs/tasks/E2/T2.1s.md` | docs |
| 28 | `b7bc0a2` | 2026-11-18 | T1.3 | fix | `docs/tasks/E1/T1.3.md`, `domain/transactions/identity.ts`, `tests/domain/transactions/identity.test.ts` | domain, tests, docs |
| 29 | `75e869e` | 2026-11-18 | T1.3 | merge | `docs/tasks/E1/T1.3.md`, `domain/transactions/identity.ts`, `domain/transactions/index.ts`, `tests/domain/transactions/identity.test.ts`, `tests/qa/identity-qa.test.ts` | domain, tests, docs |
| 30 | `fb917d5` | 2026-11-18 | T1.3 | docs | `docs/tasks/E1/T1.3.md` | docs |
| 31 | `53ec1df` | 2026-11-18 | T2.10 | test | `docs/tasks/E2/T2.10.md` | docs |
| 32 | `ae2745e` | 2026-11-18 | T1.6 | test | `tests/qa/dates-qa.test.ts`, `tests/qa/spending-qa.test.ts` | tests |
| 33 | `c122395` | 2026-11-18 | T1.6 | docs | `docs/tasks/E1/T1.6.md` | docs |
| 34 | `30263e3` | 2026-11-18 | T2.10 | docs | `README.md`, `docs/tasks/E2/T2.10.md` | docs |
| 35 | `f72368b` | 2026-11-18 | T2.10 | merge | `README.md`, `docs/tasks/E2/T2.10.md` | docs |
| 36 | `f5abd76` | 2026-11-18 | T2.5 | fix | `components/navegacao-principal.tsx`, `docs/tasks/E2/T2.5.md`, `next-env.d.ts` | components, docs, config |
| 37 | `63a966e` | 2026-11-18 | T2.10 | docs | `docs/tasks/E2/T2.10.md` | docs |
| 38 | `e5e9457` | 2026-11-18 | T2.5 | merge | `app/(app)/contas/page.tsx`, `app/(app)/enviar/page.tsx`, `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/transacoes/page.tsx`, `app/entrar/page.tsx`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/marca.tsx`, `components/navegacao-principal.tsx`, `components/pagina-vazia.tsx`, `docs/tasks/E2/T2.5.md`, `next-env.d.ts` | app, components, docs, config |
| 39 | `7193167` | 2026-11-18 | T2.5 | docs | `docs/tasks/E2/T2.5.md` | docs |
| 40 | `8e11cf7` | 2026-11-18 | T1.6 | merge | `docs/tasks/E1/T1.6.md`, `domain/dates/dates.ts`, `domain/dates/index.ts`, `domain/reports/index.ts`, `domain/reports/spending.ts`, `tests/domain/dates/dates.test.ts`, `tests/domain/reports/spending.test.ts`, `tests/qa/dates-qa.test.ts`, `tests/qa/spending-qa.test.ts` | domain, tests, docs |
| 41 | `4a9e87e` | 2026-11-18 | T1.5, T1.6, T1.7 | docs | `docs/tasks/E1/T1.5.md`, `docs/tasks/E1/T1.6.md`, `docs/tasks/E1/T1.7.md` | docs |
| 42 | `76bac37` | 2026-11-18 | T1.7 | test | `tests/domain/transfers/detect.test.ts` | tests |
| 43 | `01ae924` | 2026-11-18 | T1.7 | feat | `domain/transfers/detect.ts`, `domain/transfers/index.ts` | domain |
| 44 | `c9a2bd8` | 2026-11-18 | T2.2 | test | `docs/tasks/E2/T2.2.md`, `tests/qa/database-qa.test.ts` | tests, docs |
| 45 | `a11416e` | 2026-11-18 | T1.7 | feat | `domain/transfers/detect.ts`, `tests/domain/transfers/detect.test.ts` | domain, tests |
| 46 | `a25325d` | 2026-11-18 | T1.7 | refactor | `docs/tasks/E1/T1.7.md`, `domain/reports/spending.ts`, `domain/transactions/transaction.ts` | domain, docs |
| 47 | `614d706` | 2026-11-18 | T1.8 | test | `docs/tasks/E1/T1.8.md`, `tests/qa/categorize-qa.test.ts` | tests, docs |
| 48 | `e190999` | 2026-11-18 | T1.7 | test | `tests/qa/transfers-qa.test.ts` | tests |
| 49 | `3744644` | 2026-11-18 | T1.8 | docs | `docs/decisoes/0020-regras-e1-parte-b.md` | docs |
| 50 | `2de3d34` | 2026-11-18 | T1.7 | docs | `docs/tasks/E1/T1.7.md` | docs |
| 51 | `6b84bd5` | 2026-11-18 | — | docs | `docs/decisoes/0020-regras-e1-parte-b.md` | docs |
| 52 | `58f2fc4` | 2026-11-18 | T1.7 | merge | `docs/decisoes/0020-regras-e1-parte-b.md` | docs |
| 53 | `2aeaa71` | 2026-11-18 | T2.2 | fix | `docs/tasks/E2/T2.2.md`, `drizzle/0002_transactions_type_check.sql`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/_journal.json`, `lib/database/schema.ts`, `tests/integration/migration.test.ts`, `tests/qa/database-qa.test.ts` | lib, drizzle, tests, docs |
| 54 | `e4e5920` | 2026-11-18 | T1.7 | fix | `docs/tasks/E1/T1.7.md`, `domain/transfers/detect.ts`, `tests/qa/transfers-qa.test.ts` | domain, tests, docs |
| 55 | `f91af79` | 2026-11-18 | T1.8 | merge | `docs/tasks/E1/T1.8.md`, `domain/categories/categorize.ts`, `domain/categories/index.ts`, `tests/domain/categories/categorize.test.ts`, `tests/qa/categorize-qa.test.ts` | domain, tests, docs |
| 56 | `5b06c57` | 2026-11-18 | T1.8 | docs | `docs/decisoes/0020-regras-e1-parte-b.md`, `docs/tasks/E1/T1.8.md` | docs |
| 57 | `9f0e5ab` | 2026-11-18 | T1.7 | merge | `docs/tasks/E1/T1.7.md`, `domain/reports/spending.ts`, `domain/transactions/transaction.ts`, `domain/transfers/detect.ts`, `domain/transfers/index.ts`, `tests/domain/transfers/detect.test.ts`, `tests/qa/transfers-qa.test.ts` | domain, tests, docs |
| 58 | `f31f181` | 2026-11-18 | T1.7 | docs | `docs/decisoes/0020-regras-e1-parte-b.md`, `docs/tasks/E1/T1.7.md` | docs |
| 59 | `dffb454` | 2026-11-18 | — | docs | `CHANGELOG.md`, `docs/gates/E1.md` | docs |
| 60 | `30e86df` | 2026-11-18 | T2.2 | fix | `docs/tasks/E2/T2.2.md`, `drizzle/0003_transactions_type_currency.sql`, `drizzle/meta/0003_snapshot.json`, `drizzle/meta/_journal.json`, `lib/database/schema.ts`, `tests/integration/migration.test.ts`, `tests/lib/database/schema.test.ts`, `tests/qa/database-qa.test.ts` | lib, drizzle, tests, docs |
| 61 | `eea25f9` | 2026-11-18 | T2.2, T2.1s | merge | `docs/tasks/E2/T2.2.md`, `drizzle/0002_transactions_type_check.sql`, `drizzle/0003_transactions_type_currency.sql`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/0003_snapshot.json`, `drizzle/meta/_journal.json`, `lib/database/schema.ts`, `tests/integration/migration.test.ts`, `tests/lib/database/schema.test.ts`, `tests/qa/database-qa.test.ts` | lib, drizzle, tests, docs |
| 62 | `88e5928` | 2026-11-18 | T2.2, T2.1s | merge | `docs/tasks/E2/T2.1s.md`, `docs/tasks/E2/T2.2.md`, `drizzle.config.ts`, `drizzle/0000_schema_inicial.sql`, `drizzle/0001_rls.sql`, `drizzle/0002_transactions_type_check.sql`, `drizzle/0003_transactions_type_currency.sql`, `drizzle/meta/0000_snapshot.json`, `drizzle/meta/0001_snapshot.json`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/0003_snapshot.json`, `drizzle/meta/_journal.json`, `lib/database/client.ts`, `lib/database/schema.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tests/integration/migration.test.ts`, `tests/lib/database/schema.test.ts`, `tests/qa/database-qa.test.ts` | lib, drizzle, tests, docs, config |
| 63 | `fb6bf2a` | 2026-11-18 | T2.2, T2.1s | docs | `docs/tasks/E2/T2.1s.md`, `docs/tasks/E2/T2.2.md` | docs |

---

## Resumo por tarefa

Commits que citam mais de uma tarefa (nº 1, 7, 41, 61, 62 e 63) são contabilizados em cada tarefa mencionada.

| tarefa | commits | primeiro hash | último hash |
|---|---|---|---|
| T1.3 | 9 | `694310a` | `fb917d5` |
| T1.5 | 3 | `a4799f8` | `4a9e87e` |
| T1.6 | 7 | `a266bb7` | `4a9e87e` |
| T1.7 | 11 | `4a9e87e` | `f31f181` |
| T1.8 | 8 | `a266bb7` | `5b06c57` |
| T2.1s | 7 | `d41572f` | `fb6bf2a` |
| T2.2 | 14 | `a266bb7` | `fb6bf2a` |
| T2.5 | 6 | `694310a` | `7193167` |
| T2.10 | 6 | `694310a` | `63a966e` |
| — | 2 | `6b84bd5` | `dffb454` |

---

## Commits que tocam `config`

| nº | hash | data | assunto | arquivos de config |
|---|---|---|---|---|
| 15 | `4a2c417` | 2026-11-18 | feat(E2/T2.2): dependências drizzle-orm, postgres e drizzle-kit e scripts db:* | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| 16 | `48d7b1a` | 2026-11-18 | feat(E2/T2.2): schema Drizzle, migrações com RLS e cliente de servidor | `drizzle.config.ts` |
| 22 | `c78d21d` | 2026-11-18 | chore(E2/T2.2): exceção no .gitignore para as migrações SQL em drizzle/ (ADR-0021) | `.gitignore` |
| 23 | `d5303ee` | 2026-11-18 | Merge branch 'claude/zen-mayer-trcp1r' into agent/T2.1s-backend | `.gitignore` |
| 24 | `8e71d83` | 2026-11-18 | Merge branch 'claude/zen-mayer-trcp1r' into qa/T2.2 | `.gitignore` |
| 26 | `1a18c51` | 2026-11-18 | fix(E2/T2.1s): sobe o Next para 16.4.6 (correção de segurança) | `package.json`, `pnpm-lock.yaml` |
| 36 | `f5abd76` | 2026-11-18 | fix(E2/T2.5): contorno de foco da navegação sem corte e alvo mínimo de 44 px | `next-env.d.ts` |
| 38 | `e5e9457` | 2026-11-18 | merge(E2/T2.5): shell da interface (QA, rodada 1) | `next-env.d.ts` |
| 62 | `88e5928` | 2026-11-18 | merge(E2/T2.2, T2.1s): schema, migrações e RLS; Next 16.4.6 (QA, revisor APROVADO, rodadas 1 e 2) | `drizzle.config.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |

---

## Commits de merge

Obtidos via `git rev-list --merges main..origin/pendente/zen-mayer-E1-E2` (12 commits) e pais obtidos via `git log -1 --format="%P" <hash>`:

| nº | hash | data | assunto | pai 1 | pai 2 |
|---|---|---|---|---|---|
| 12 | `6c51cd8` | 2026-11-18 | Merge branch 'claude/zen-mayer-trcp1r' into agent/T1.8-backend | `6c9de9a` (`6c9de9a641eb63897c2c7749623478beb83b621e`) | `d41572f` (`d41572f40c0398c0d7ae4c4d77334eedd71704f5`) |
| 23 | `d5303ee` | 2026-11-18 | Merge branch 'claude/zen-mayer-trcp1r' into agent/T2.1s-backend | `6a31ab7` (`6a31ab7e1dde5cbdc6c17e0b8dd9d54e2fe34327`) | `c78d21d` (`c78d21d01bb736b84ae9a3ec054e117410b1dce4`) |
| 24 | `8e71d83` | 2026-11-18 | Merge branch 'claude/zen-mayer-trcp1r' into qa/T2.2 | `6a31ab7` (`6a31ab7e1dde5cbdc6c17e0b8dd9d54e2fe34327`) | `c78d21d` (`c78d21d01bb736b84ae9a3ec054e117410b1dce4`) |
| 29 | `75e869e` | 2026-11-18 | merge(E1/T1.3): identidade e dedup (QA PASS, revisor APROVADO, rodadas 1 e 2) | `c78d21d` (`c78d21d01bb736b84ae9a3ec054e117410b1dce4`) | `b7bc0a2` (`b7bc0a21014b42e4cfd713efe004cc32e9c18bd3`) |
| 35 | `f72368b` | 2026-11-18 | merge(E2/T2.10): README de instalação (QA, rodada 1) | `fb917d5` (`fb917d5744599f6075266719da687ccb646df470`) | `30263e3` (`30263e3e582f47db6acc6ff053627d73dc426d1d`) |
| 38 | `e5e9457` | 2026-11-18 | merge(E2/T2.5): shell da interface (QA, rodada 1) | `63a966e` (`63a966e1825bb779e492c15f3e2cfb493cc25536`) | `f5abd76` (`f5abd764d78758e9f5daee13c9c01456a1d3788f`) |
| 40 | `8e11cf7` | 2026-11-18 | merge(E1/T1.6): gastos do período e datas civis (QA PASS, revisor APROVADO) | `7193167` (`719316713f329296dbe43549255658469ccc49a6`) | `c122395` (`c122395c72f4fa2f3d5dfe4c8391faf9c5ac7028`) |
| 52 | `58f2fc4` | 2026-11-18 | Merge branch 'claude/zen-mayer-trcp1r' into agent/T1.7b-backend | `2de3d34` (`2de3d347131ae98fdf36121cd5f334857b845745`) | `6b84bd5` (`6b84bd5afbac4e5ed3921dd682f846910aba402a`) |
| 55 | `f91af79` | 2026-11-18 | merge(E1/T1.8): categorizador (QA PASS, revisor APROVADO) | `6b84bd5` (`6b84bd5afbac4e5ed3921dd682f846910aba402a`) | `614d706` (`614d706fce6fab887797ec968c5292d31797058e`) |
| 57 | `9f0e5ab` | 2026-11-18 | merge(E1/T1.7): transferências internas (QA PASS, revisor APROVADO, rodada 1) | `5b06c57` (`5b06c57e09191596f8ccdc32bc65a2110754288b`) | `e4e5920` (`e4e59209b20029f0af65bfe74668e1bf3c2460ee`) |
| 61 | `eea25f9` | 2026-11-18 | Merge branch 'agent/T2.2b-backend' into agent/T2.1s-backend | `766aff5` (`766aff5e64198bced62430d8d724a9aa3484a74c`) | `30e86df` (`30e86df5a070db3fd720719d44502b51cf7c85ce`) |
| 62 | `88e5928` | 2026-11-18 | merge(E2/T2.2, T2.1s): schema, migrações e RLS; Next 16.4.6 (QA, revisor APROVADO, rodadas 1 e 2) | `dffb454` (`dffb45405d851b3dfa8f448f641a15f2074b96ab`) | `eea25f9` (`eea25f934f0e76ae1be5f83fc909536c3db2fa9c`) |

---

## ADRs novos ou alterados

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" diff --stat main...origin/pendente/zen-mayer-E1-E2 -- docs/decisoes/
```
Saída:
```text
 docs/decisoes/0020-regras-e1-parte-b.md | 61 +++++++++++++++++++++++++++++++++
 docs/decisoes/0021-banco-e2.md          | 15 ++++++++
 docs/decisoes/README.md                 |  2 ++
 3 files changed, 78 insertions(+)
```
