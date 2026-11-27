# Adendo da equipe Claude (depois do PRONTO 4d175f2)

Escrito em 19/11/2026, enquanto a equipe Google fazia a sua auditoria. **Não altera** os arquivos G1 a G4 de `4d175f2`, que continuam sendo a versão que concorre no debate. Este adendo só registra o que foi verificado depois e o que mudou no repositório.

- **Alvo:** `origin/pendente/zen-mayer-E1-E2`, ponta `fb6bf2a` (antes `origin/claude/zen-mayer-trcp1r`; mesmo commit).
- **`main` agora:** `6b0ca36` (PR #20). Na auditoria era `8ea548b`.

## 1. Correção: a entrada em `main` não é mais fast-forward

O G2 (achado 3) e o G3 ("Conflitos") dizem que a zen-mayer "entraria como avanço direto (fast-forward)". Isso valia com `main` em `8ea548b`. O PR #20 entrou depois.

| Comando | Resultado |
| --- | --- |
| `git merge-base origin/main origin/pendente/zen-mayer-E1-E2` | `8ea548b` (igual) |
| `git rev-list --count origin/main..origin/pendente/zen-mayer-E1-E2` | `63` (igual) |
| `git merge-base --is-ancestor origin/main origin/pendente/zen-mayer-E1-E2` | falso: **não é mais fast-forward** |
| `git diff --name-only 8ea548b origin/main` | 9 arquivos, só `.agents/`, `GEMINI.md` e `docs/delegacao/` |
| arquivos tocados pelos dois lados | nenhum |
| `git merge-tree --write-tree --name-only origin/main origin/pendente/zen-mayer-E1-E2` | exit 0, **sem conflito** |
| `git merge-tree --write-tree --name-only origin/docs/E1-T1.3-cartao origin/pendente/zen-mayer-E1-E2` | `CONFLICT (add/add)` em `docs/tasks/E1/T1.3.md` (já era o D4 do G3) |

**Efeito:** o merge vai precisar de um commit de merge (ou de rebase). Nada mais muda nos vereditos.

## 2. Merge simulado passa nas verificações

Commit de merge feito só no local, a partir da árvore do `merge-tree` (pais `6b0ca36` e `fb6bf2a`), sem push. Dependências com `npx pnpm@12.11.2 install --frozen-lockfile`.

| Comando | Exit | Resultado |
| --- | --- | --- |
| `pnpm typecheck` | 0 | — |
| `pnpm lint` | 0 | — |
| `pnpm test` (sem banco) | 0 | 25 arquivos passaram, 2 pulados; 1351 passaram, 3 expected fail, 37 pulados (1391) |
| `pnpm format:check` | 0 | todos os arquivos no estilo do Prettier |

## 3. Fecha o item 1b do G2: testes contra Postgres real

O G2 marcou PARCIAL porque os testes de banco não rodaram. **O CI também não os roda**: `.github/workflows/ci.yml` não sobe Postgres. Então esses testes nunca tinham rodado.

- **Banco:** Postgres **17.11** (mesma versão do `docker-compose.yml`), portátil, pelo pacote npm `embedded-postgres@17.11.0-beta.19` (MIT), numa pasta temporária fora do projeto, porta só local. Banco vazio e descartado no fim. Docker não estava instalado.
- **Comando:** `TEST_DATABASE_URL=<local> pnpm vitest run tests/integration tests/qa/database-qa.test.ts` no merge simulado.

| Resultado | Detalhe |
| --- | --- |
| 2 arquivos, **35 passaram, 1 expected fail** (36) | o expected fail é o **RISCO-T2.2-QA-02** já registrado (FK da transação não amarra conta e usuário) |
| suíte inteira com o banco | 27 arquivos passaram; **1386 passaram, 4 expected fail, 1 pulado** (1391) |
| o 1 pulado | `tests/qa/domain-files-qa.test.ts:78`, link simbólico no Windows; também é pulado em `main` |

**Veredito do item 1b: OK.** Migrações, 11 tabelas, RLS ligado e forçado, unicidade de `(account_id, identity_key)` e acesso negado ao papel sem `BYPASSRLS` foram conferidos num Postgres real.

## 4. Fecha o item 7 do G2: gitleaks

- **Ferramenta:** gitleaks **8.30.1**, a mesma versão do CI. Binário oficial `gitleaks_8.30.1_windows_x64.zip`, conferido com o `gitleaks_8.30.1_checksums.txt` da release (`sha256sum -c`: OK). A linha do Linux nesse arquivo é idêntica ao `GITLEAKS_SHA256` fixado no `ci.yml`.

| Comando | Resultado |
| --- | --- |
| `gitleaks git --no-banner --redact --log-opts="origin/main..origin/pendente/zen-mayer-E1-E2" .` | 51 commits varridos, **no leaks found**, exit 0 |
| `git rev-list --count --no-merges` / `--merges` no mesmo intervalo | 51 / 12 (soma 63: os merges não trazem patch próprio) |
| `gitleaks git --no-banner --redact .` (histórico inteiro) | 134 commits varridos, **no leaks found** |

**Veredito do item 7: OK.**

## 5. O que muda para o dono

- Os dois pontos que o G2 deixou "antes do merge" (banco real e gitleaks) **estão verificados e limpos**.
- Continua valendo: as decisões D1 a D4 do G3, os bugs conhecidos BUG-T1.6-01 e RISCO-T2.2-QA-02, e o conflito do cartão da T1.3.
- **Recomendação nova:** pôr Postgres no CI (um `services: postgres:17.11` no job `check` com `TEST_DATABASE_URL`). Sem isso, os 36 testes de banco continuam sem rodar em PR. Isso mexe em `.github/` e precisa de cartão.
