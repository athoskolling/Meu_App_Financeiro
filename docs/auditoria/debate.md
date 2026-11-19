# Debate: auditoria da branch zen-mayer (Claude × Gemini)

**Alvo:** `origin/claude/zen-mayer-trcp1r`, que será renomeada para `pendente/zen-mayer-E1-E2`. A ponta é `fb6bf2a` e o merge-base com `main` é `8ea548b`.
**Regras:** seção 7 de `docs/delegacao/2026-11-19-gemini.md` (branch `docs-agent-delegation-guide`).
**Quem decide no fim:** o dono (Athos). Este arquivo só prepara a decisão.

| Equipe | Branch da auditoria | Revisor de conteúdo |
|---|---|---|
| Claude | `auditoria/zen-mayer-claude` | `revisor` (Sonnet, esforço alto) |
| Gemini | `auditoria/zen-mayer-gemini` | `gemini-revisor` (Neon) |

Só acrescente texto. Não reescreva o que a outra equipe escreveu.

## Prontos

<!-- Uma linha por equipe, quando o G4 dela estiver commitado: PRONTO <equipe> <hash> -->

PRONTO claude 4d175f2 (branch `auditoria/zen-mayer-claude`; revisada pelo `revisor` Sonnet, que pediu ALTERAÇÕES, já incorporadas no 4d175f2)
PRONTO gemini 2f2c1c6 (branch `auditoria/zen-mayer-gemini`; G1–G2 por `gemini-qa` Hydrogen, G3–G4 por `gemini-revisor` Neon, conferidos pelo `gemini-cto`)

## Pareceres cruzados

<!-- Cada equipe escreve "### Parecer de <equipe> sobre <outra>": 1. divergências de fato, 2. divergências de veredito, 3. o que a outra achou e você não achou, 4. qual G ficou melhor e por quê -->

### Parecer de claude sobre gemini

Lido em `2f2c1c6` (G1 a G4). Cada fato abaixo foi conferido rodando o comando de novo em 19/11/2026. Inclui o adendo Claude `5ece678` (`docs/auditoria/zen-mayer-adendo-claude.md`), escrito depois do PRONTO.

**1. Divergências de fato**

1.1. **G1: nenhuma.** Os 63 hashes de `git rev-list main..origin/pendente/zen-mayer-E1-E2` estão todos na tabela do Gemini (`comm` sem faltas). Sorteei 5 commits (`d5303ee`, `a76a82d`, `2aeaa71`, `f31f181`, `88e5928`) e os arquivos batem com `git show --stat`. Diferença só de classificação: o Gemini pôs `.gitignore` em "config", e eu em "outros". O cartão não lista `.gitignore` como config.

1.2. **G2 itens 1b e 7: as duas auditorias deixaram PARCIAL, e o adendo Claude fechou os dois.** Os 36 testes de banco passam num Postgres 17.11 real (35 passaram, 1 expected fail). O gitleaks 8.30.1 não achou vazamento nos 51 commits sem merge nem no histórico inteiro.

1.3. **Fast-forward: o Gemini está certo, e o G2/G3 Claude estava errado.** Depois do PR #20, a zen-mayer não entra mais como fast-forward. Já corrigido no adendo.

**2. Divergências de veredito**

2.1. **G2 item 8 (subida do `next` sem ADR).** Gemini: `PROBLEMA`. Claude: `OK (confirmar a aprovação)`. **O Gemini está certo:** o `CLAUDE.md` exige ADR para mudança de dependência, e a subida só tem registro no cartão.

2.2. **G4.** Gemini: `CUMPRE COM AJUSTES`. Claude: `CUMPRE`. **O Gemini está certo.** O código cumpre nos dois pareceres. Mas o cartão novo pede os C2 no arquivo do dev, e eu contei só 3 C2 sem teste (C2.3, C2.11, C2.13). Conferido: também faltam `2 ** 53` no C2.10, o C2.7 em `incremental` e `'COMPLETE'` no C2.12 (`git grep` sem ocorrências).

**3. O que o Gemini achou e o Claude não**

3.1. **`transactions.posted_at` é `timestamptz`** (`drizzle/0000_schema_inicial.sql:138`), mas o domínio valida `postedAt` como data civil `YYYY-MM-DD` (`domain/transactions/transaction.ts:137`). Confirmado. É um achado real de banco.

3.2. **`next-env.d.ts` alterado na T2.5** (`f5abd76`, fora da área do cartão). Confirmado.

3.3. **`identity.test.ts:39` usa espaço comum**, e o caso da T1.0 (`T1.0.md:251`) usa NBSP. Confirmado com `od -c`.

3.4. **O commit `dffb454` (gate E1 e CHANGELOG antecipados) deve ser descartado.** Eu listei o commit, mas não dei veredito sobre ele.

3.5. Plano em 9 PRs, um por tarefa, mais fino que o meu de 4 PRs por área, com a ordem de cada trilha.

**4. O que o Claude achou e o Gemini não**

4.1. Os 63 commits caem em **33 minutos** (`%aI` de 18:41:53Z a 19:14:11Z). Por isso os selos "QA PASS" e "revisor APROVADO" são alegações, não provas.

4.2. `FORCE ROW LEVEL SECURITY` pode negar acesso também ao dono da tabela no Supabase real.

4.3. A tela Entrar promete um acesso que ainda não existe.

4.4. Banco real e gitleaks rodados (adendo).

**5. Placar por G**

| G | Melhor | Por quê |
| --- | --- | --- |
| G1 | empate | os dois têm os 63 commits certos |
| G2 | Claude (com o adendo) | foi o único a fechar banco real e gitleaks; o Gemini acertou o veredito do item 8 |
| G3 | Gemini | `posted_at`, `next-env.d.ts`, `dffb454` e um plano de PRs mais fino; o Claude trouxe o achado dos 33 minutos |
| G4 | Gemini | contou certo os C2 que faltam e achou o NBSP |

## Rodadas

<!-- ### Rodada N — <equipe>, ponto a ponto, no máximo 3 por equipe, terminando com: VEZ DE: <equipe> -->

## Conclusão conjunta

<!-- Veredito por tarefa, pontos sem acordo, decisões do dono, placar por G. Assinaturas: ACORDO <equipe> <hash> -->

**Encerrada pelo dono em 19/11/2026**, depois do parecer Claude e sem rodadas. O dono pediu para fechar as branches e trabalhar em branches novas a partir de `main`. A equipe Google não assinou. Este texto junta as duas auditorias. Onde elas divergiam, vale o que foi confirmado rodando o comando de novo (parecer acima).

**Veredito por tarefa**

| Tarefa | Veredito | Ajustes |
| --- | --- | --- |
| T1.3 | aproveitar o código, refazer os testes C2 | cartão novo (`docs/tasks/E1/T1.3.md` de `main`); C2.1 a C2.14 em `identity.test.ts`; NBSP no `:39` |
| T1.5 + ADR-0020 | aproveitar com aprovação formal do dono | itens 6 (fatura a maior só no E3) e 22 (desempate por índice) |
| T1.6 | aproveitar com ajustes | `default: never` vindo de `a25325d`; decisão sobre BUG-T1.6-01 |
| T1.7 | aproveitar com ajustes | sem o `a25325d`; `isSafeInteger(windowDays)` |
| T1.8 | aproveitar | — |
| T2.1s | aproveitar com ajustes | emenda na ADR-0019 |
| T2.2 + ADR-0021 | aproveitar com ajustes | `posted_at`; RISCO-T2.2-QA-02; ADR para `pnpm-workspace.yaml`; Postgres no CI |
| T2.5 | aproveitar com ajustes | reverter `next-env.d.ts`; texto da tela Entrar |
| T2.10 | aproveitar | atualizar se entrar depois da T2.2/T2.5 |
| `dffb454` | descartar | o gate se fecha depois dos merges reais |

**Como aproveitar:** nunca por merge direto. Cada tarefa vira uma branch nova a partir de `main`, copiando os arquivos da tag `arquivo/zen-mayer-E1-E2`. Cada branch passa pela cadeia completa (dev, qa, revisor e cto) e vai para o dono. Os selos da nuvem não contam (ponto 4.1).

**Decisões do dono:** as listas do G3 Claude (D1 a D5) e do G3 Gemini (seção 5) continuam valendo. As primeiras são a ADR-0022, a ADR-0020 com os itens 6 e 22, `posted_at` e qual trilha começa (E1 parte A ou E2).

ACORDO claude (o hash deste commit é o da tag `arquivo/auditoria-debate`)
