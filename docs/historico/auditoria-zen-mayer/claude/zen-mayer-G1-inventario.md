# G1: inventário dos commits da branch zen-mayer (equipe Claude)

- **Alvo:** `origin/claude/zen-mayer-trcp1r`, ponta `fb6bf2a`, merge-base com `main` `8ea548b`.
- **Contagem:** `git rev-list --count main..origin/claude/zen-mayer-trcp1r` → **63**. A tabela tem 63 linhas.
- **Fonte:** `git log --reverse --format='%h|%ad|%s' --date=short main..origin/claude/zen-mayer-trcp1r`; arquivos por `git show --stat` (merges: `git diff --name-only <h>^1 <h>`).
- **Áreas:** domain, lib, drizzle, app, components, tests, docs; config = package.json, lockfile, tsconfig*, eslint.config.*, next.config.*, drizzle.config.*, .github/; outros = o resto (README, .gitignore, CHANGELOG, pnpm-workspace.yaml, next-env.d.ts).
- Todos os commits são de 18/11/2026.

| nº | hash | tarefa | tipo | pais | arquivos | áreas | assunto |
|---|---|---|---|---|---|---|---|
| 1 | `694310a` | T1.3 | docs | 1 | 3 | docs | docs(E1,E2): cartões T1.3, T2.5 e T2.10 |
| 2 | `8148e59` | T1.3 | test | 1 | 1 | tests | test(E1/T1.3): casos C da T1.0 para identidade e dedup (falham de início) |
| 3 | `6c9de9a` | T1.3 | feat | 1 | 3 | docs,domain | feat(E1/T1.3): identidade e dedup com existingCounts |
| 4 | `a4799f8` | T1.5 | docs | 1 | 2 | docs | docs(E1): casos da T1.5 e ADR-0020 (proposta, aguarda o dono) |
| 5 | `73e02ff` | T2.5 | feat | 1 | 13 | app,components,docs | feat(E2/T2.5): shell da interface, navegação e tela Entrar |
| 6 | `d08abef` | T2.10 | docs | 1 | 2 | docs,outros | docs(E2/T2.10): README de instalação |
| 7 | `a266bb7` | T1.5 | docs | 1 | 7 | docs | docs(E1,E2): aprovação da T1.5 e ADR-0020; ADR-0021; cartões T1.6, T1.8 e T2.2 |
| 8 | `2422e93` | T1.6 | test | 1 | 2 | tests | test(E1/T1.6): casos de datas civis e gastos do período (falham: sem implementação) |
| 9 | `d41572f` | T2.1s | docs | 1 | 1 | docs | docs(E2): cartão T2.1s, subida do Next aprovada pelo dono |
| 10 | `8122c1a` | T1.6 | feat | 1 | 5 | docs,domain | feat(E1/T1.6): datas civis e spendingForPeriod |
| 11 | `37c98cc` | T1.3 | test | 1 | 1 | tests | test(E1/T1.3): QA independente de identidade e dedup (propriedades, Unicode, bordas) |
| 12 | `6c51cd8` | T1.8 | merge | 2 | 8 | docs | Merge branch 'claude/zen-mayer-trcp1r' into agent/T1.8-backend |
| 13 | `a76a82d` | T1.3 | docs | 1 | 1 | docs | docs(E1/T1.3): verificação do QA no cartão (veredito PASS, 2 bugs baixa) |
| 14 | `7dc1302` | T1.8 | test | 1 | 1 | tests | test(E1/T1.8): casos do categorizador (falham: sem implementação) |
| 15 | `4a2c417` | T2.2 | feat | 1 | 3 | config,outros | feat(E2/T2.2): dependências drizzle-orm, postgres e drizzle-kit e scripts db:* |
| 16 | `48d7b1a` | T2.2 | feat | 1 | 6 | config,drizzle,lib | feat(E2/T2.2): schema Drizzle, migrações com RLS e cliente de servidor |
| 17 | `8660028` | T2.2 | feat | 1 | 2 | tests | feat(E2/T2.2): testes estático e de integração das migrações |
| 18 | `ae9b474` | T2.2 | docs | 1 | 1 | docs | docs(E2/T2.2): relatório do agente |
| 19 | `6af3420` | T1.3 | fix | 1 | 3 | docs,domain,tests | fix(E1/T1.3): espaço Unicode completo e ocorrência fora do intervalo seguro |
| 20 | `6a31ab7` | T2.2 | feat | 1 | 2 | drizzle | feat(E2/T2.2): adiciona as migrações SQL (forçadas: .gitignore bloqueia *.sql) |
| 21 | `9369800` | T1.8 | feat | 1 | 3 | docs,domain | feat(E1/T1.8): categorizador |
| 22 | `c78d21d` | T2.2 | chore | 1 | 1 | outros | chore(E2/T2.2): exceção no .gitignore para as migrações SQL em drizzle/ (ADR-0021) |
| 23 | `d5303ee` | T2.1s | merge | 2 | 2 | docs,outros | Merge branch 'claude/zen-mayer-trcp1r' into agent/T2.1s-backend |
| 24 | `8e71d83` | T2.2 | merge | 2 | 2 | docs,outros | Merge branch 'claude/zen-mayer-trcp1r' into qa/T2.2 |
| 25 | `d3b0ac4` | T2.5 | test | 1 | 1 | docs | test(E2/T2.5): verificação do QA |
| 26 | `1a18c51` | T2.1s | fix | 1 | 2 | config | fix(E2/T2.1s): sobe o Next para 16.4.6 (correção de segurança) |
| 27 | `766aff5` | T2.1s | docs | 1 | 1 | docs | docs(E2/T2.1s): relatório do agente |
| 28 | `b7bc0a2` | T1.3 | fix | 1 | 3 | docs,domain,tests | fix(E1/T1.3): identityKey e existingCounts exigem inteiro seguro |
| 29 | `75e869e` | T1.3 | merge | 2 | 5 | docs,domain,tests | merge(E1/T1.3): identidade e dedup (QA PASS, revisor APROVADO, rodadas 1 e 2) |
| 30 | `fb917d5` | T1.3 | docs | 1 | 1 | docs | docs(E1/T1.3): parecer do revisor e revisão do CTO |
| 31 | `53ec1df` | T2.10 | test | 1 | 1 | docs | test(E2/T2.10): verificação do QA |
| 32 | `ae2745e` | T1.6 | test | 1 | 2 | tests | test(E1/T1.6): QA independente de datas civis e gastos do período |
| 33 | `c122395` | T1.6 | docs | 1 | 1 | docs | docs(E1/T1.6): verificação do QA no cartão (veredito PASS, 1 bug baixa) |
| 34 | `30263e3` | T2.10 | docs | 1 | 2 | docs,outros | docs(E2/T2.10): corrige senha padrão e aviso de next-env.d.ts no README |
| 35 | `f72368b` | T2.10 | merge | 2 | 2 | docs,outros | merge(E2/T2.10): README de instalação (QA, rodada 1) |
| 36 | `f5abd76` | T2.5 | fix | 1 | 3 | components,docs,outros | fix(E2/T2.5): contorno de foco da navegação sem corte e alvo mínimo de 44 px |
| 37 | `63a966e` | T2.10 | docs | 1 | 1 | docs | docs(E2/T2.10): revisão do CTO |
| 38 | `e5e9457` | T2.5 | merge | 2 | 14 | app,components,docs,outros | merge(E2/T2.5): shell da interface (QA, rodada 1) |
| 39 | `7193167` | T2.5 | docs | 1 | 1 | docs | docs(E2/T2.5): revisão do CTO |
| 40 | `8e11cf7` | T1.6 | merge | 2 | 9 | docs,domain,tests | merge(E1/T1.6): gastos do período e datas civis (QA PASS, revisor APROVADO) |
| 41 | `4a9e87e` | T1.6 | docs | 1 | 3 | docs | docs(E1): revisões da T1.6, nota na T1.5 e cartão T1.7 |
| 42 | `76bac37` | T1.7 | test | 1 | 1 | tests | test(E1/T1.7): casos de transferências internas (falham: sem implementação) |
| 43 | `01ae924` | T1.7 | feat | 1 | 2 | domain | feat(E1/T1.7): detectTransfers |
| 44 | `c9a2bd8` | T2.2 | test | 1 | 2 | docs,tests | test(E2/T2.2): QA independente do schema, migrações e RLS |
| 45 | `a11416e` | T1.7 | feat | 1 | 2 | domain,tests | feat(E1/T1.7): usa negate de money na comparação de valores |
| 46 | `a25325d` | T1.7 | refactor | 1 | 3 | docs,domain | refactor(E1/T1.7): default exaustivo em spending e daysInMonth compartilhado |
| 47 | `614d706` | T1.8 | test | 1 | 2 | docs,tests | test(E1/T1.8): QA independente do categorizador (seção G, propriedades e ataques) |
| 48 | `e190999` | T1.7 | test | 1 | 1 | tests | test(E1/T1.7): QA independente de transferências internas e da manutenção |
| 49 | `3744644` | T1.8 | docs | 1 | 1 | docs | docs(E1): esclarecimentos da ADR-0020 levantados pelo QA da T1.8 |
| 50 | `2de3d34` | T1.7 | docs | 1 | 1 | docs | docs(E1/T1.7): verificação do QA no cartão (veredito PASS, 1 bug média) |
| 51 | `6b84bd5` | — | docs | 1 | 1 | docs | docs(E1): ADR-0020 item 22, tipo no desempate de transferências |
| 52 | `58f2fc4` | T1.7b | merge | 2 | 1 | docs | Merge branch 'claude/zen-mayer-trcp1r' into agent/T1.7b-backend |
| 53 | `2aeaa71` | T2.2 | fix | 1 | 7 | docs,drizzle,lib,tests | fix(E2/T2.2): CHECK em transactions.type (migração 0002), teste de integração reexecutável |
| 54 | `e4e5920` | T1.7 | fix | 1 | 3 | docs,domain,tests | fix(E1/T1.7): tipo entra no texto canônico do desempate (BUG-T1.7-01) |
| 55 | `f91af79` | T1.8 | merge | 2 | 5 | docs,domain,tests | merge(E1/T1.8): categorizador (QA PASS, revisor APROVADO) |
| 56 | `5b06c57` | T1.8 | docs | 1 | 2 | docs | docs(E1/T1.8): parecer do revisor, revisão do CTO e esclarecimento 19 |
| 57 | `9f0e5ab` | T1.7 | merge | 2 | 7 | docs,domain,tests | merge(E1/T1.7): transferências internas (QA PASS, revisor APROVADO, rodada 1) |
| 58 | `f31f181` | T1.7 | docs | 1 | 2 | docs | docs(E1/T1.7): parecer do revisor, revisão do CTO e ADR-0020 item 22 |
| 59 | `dffb454` | — | docs | 1 | 2 | docs,outros | docs(E1): gate E1 preparado pelo CTO e CHANGELOG v0.1 e v0.1.1 |
| 60 | `30e86df` | T2.2 | fix | 1 | 8 | docs,drizzle,lib,tests | fix(E2/T2.2): type NOT NULL e currency BRL (migração 0003) |
| 61 | `eea25f9` | T2.2b | merge | 2 | 10 | docs,drizzle,lib,tests | Merge branch 'agent/T2.2b-backend' into agent/T2.1s-backend |
| 62 | `88e5928` | T2.2 | merge | 2 | 20 | config,docs,drizzle,lib,outros,tests | merge(E2/T2.2, T2.1s): schema, migrações e RLS; Next 16.4.6 (QA, revisor APROVADO, rodadas 1 e 2) |
| 63 | `fb6bf2a` | T2.2 | docs | 1 | 2 | docs | docs(E2): pareceres e revisão do CTO da T2.2 e da T2.1s |

## Resumo por tarefa

| tarefa | commits | primeiro | último |
|---|---|---|---|
| T1.3 | 9 | `694310a` | `fb917d5` |
| T1.5 | 2 | `a4799f8` | `a266bb7` |
| T1.6 | 6 | `2422e93` | `4a9e87e` |
| T1.7 | 10 | `76bac37` | `f31f181` |
| T1.8 | 7 | `6c51cd8` | `5b06c57` |
| T2.1s | 4 | `d41572f` | `766aff5` |
| T2.2 | 13 | `4a2c417` | `fb6bf2a` |
| T2.5 | 5 | `73e02ff` | `7193167` |
| T2.10 | 5 | `d08abef` | `63a966e` |
| — | 2 | `6b84bd5` | `dffb454` |

## Merges (12)

- `6c51cd8`: pais 6c9de9a d41572f
- `d5303ee`: pais 6a31ab7 c78d21d
- `8e71d83`: pais 6a31ab7 c78d21d
- `75e869e`: pais c78d21d b7bc0a2
- `f72368b`: pais fb917d5 30263e3
- `e5e9457`: pais 63a966e f5abd76
- `8e11cf7`: pais 7193167 c122395
- `58f2fc4`: pais 2de3d34 6b84bd5
- `f91af79`: pais 6b84bd5 614d706
- `9f0e5ab`: pais 5b06c57 e4e5920
- `eea25f9`: pais 766aff5 30e86df
- `88e5928`: pais dffb454 eea25f9

## Commits que tocam config

- `4a2c417` (T2.2): feat(E2/T2.2): dependências drizzle-orm, postgres e drizzle-kit e scripts db:*
- `48d7b1a` (T2.2): feat(E2/T2.2): schema Drizzle, migrações com RLS e cliente de servidor
- `1a18c51` (T2.1s): fix(E2/T2.1s): sobe o Next para 16.4.6 (correção de segurança)
- `88e5928` (T2.2): merge(E2/T2.2, T2.1s): schema, migrações e RLS; Next 16.4.6 (QA, revisor APROVADO, rodadas 1 e 2)

## ADRs novos ou alterados

- `docs/decisoes/0020-regras-e1-parte-b.md` (novo; status: aceita, aprovada pelo dono em 18/11/2026 segundo o próprio arquivo)
- `docs/decisoes/0021-banco-e2.md` (novo; status: aceita, dependências aprovadas pelo dono em 18/11/2026, "Aprovo as 3")
- `docs/decisoes/README.md` (alterado)
