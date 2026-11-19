# Auditoria `zen-mayer` — G3: Avaliação por tarefa e plano de PRs

- **Data:** 2026-11-19
- **Branch alvo:** `origin/pendente/zen-mayer-E1-E2` (ponta `fb6bf2a`, `fb6bf2adc953b586de64e8863abfe5ec94fd9fdd`)
- **Base `main`:** `6b0ca36` (`6b0ca365a76117791ea386ff9127b3518719ceea`)
- **Merge-base (`main` × alvo):** `8ea548b` (`8ea548b58bd9334af8ab6520117e056eb12b9e9e`)
- **Trabalho novo de referência:** `docs/E1-T1.3-cartao` (`597b1e5`, cartão novo da T1.3 e ADR-0022 proposta)
- **Fontes de prova:** `docs/historico/auditoria-zen-mayer/zen-mayer-G1-inventario.md`, `docs/historico/auditoria-zen-mayer/zen-mayer-G2-travas.md`, `ROADMAP.md`, `docs/spec/Fase0_roteiro.md`, `docs/spec/Meu_financeiro.md`, `CLAUDE.md`, inspeção direta de código e cartões no worktree somente leitura `gemini-zen-mayer` e comandos Git no worktree `gemini`.

---

## Tabela resumo dos vereditos

| Tarefa | Área / Estágio | Regra financeira / Segurança? | Depende de algo fora de `main`? | Veredito |
|---|---|---|---|---|
| `T1.3` | E1 parte A — Identidade e dedup | Sim (regra financeira) | Não (só decisão da ADR-0022) | `APROVEITAR COM AJUSTES` |
| `T1.5` | E1 parte B — Casos de teste + ADR-0020 | Sim (especificação de regras) | Não | `APROVEITAR COM AJUSTES` |
| `T1.6` | E1 parte B — Datas civis e `spendingForPeriod` | Sim (regra financeira) | Sim (`T1.5`, ADR-0020; `ROADMAP` cita `T1.3`) | `APROVEITAR COM AJUSTES` |
| `T1.7` | E1 parte B — `detectTransfers` | Sim (regra financeira) | Sim (`T1.3`, `T1.5`, `T1.6`, ADR-0020) | `APROVEITAR COM AJUSTES` |
| `T1.8` | E1 parte B — `categorize` | Sim (regra financeira) | Sim (`T1.3`, `T1.5`, ADR-0020) | `APROVEITAR` |
| `T2.1s` | E2 — Bump `next` `^16.4.1` → `^16.4.6` | Sim (segurança / dependência) | Não (no código; na branch veio sobre `T2.2`) | `APROVEITAR COM AJUSTES` |
| `T2.2` | E2 — Schema Drizzle, migrações, RLS + ADR-0021 | Sim (banco / RLS / dependências) | Não (beneficia-se de `T2.1s` antes) | `APROVEITAR COM AJUSTES` |
| `T2.5` | E2 — Shell da interface e `/entrar` | Não (UI estática) | Não (beneficia-se de `T2.1s` antes) | `APROVEITAR COM AJUSTES` |
| `T2.10` | E2 — `README.md` de instalação | Não (documentação) | Não | `APROVEITAR` |
| `6b84bd5` (sem tarefa) | E1 — ADR-0020 item 22 | Sim (desempate de transferências) | Sim (`T1.5`, ADR-0020) | `APROVEITAR COM AJUSTES` |
| `dffb454` (sem tarefa) | E1 — `docs/gates/E1.md` e `CHANGELOG.md` | Não (governança / gate) | Sim (toda a E1 + assinatura do dono) | `DESCARTAR` |

---

## 1. Choques globais com `main` e com o trabalho novo

### 1.1 Comandos executados e resultados

**1. Ponto de divergência (`merge-base`):**

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" merge-base main origin/pendente/zen-mayer-E1-E2
```

Saída:

```text
8ea548b58bd9334af8ab6520117e056eb12b9e9e
```

**2. O que `main` alterou depois de `8ea548b`:**

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" diff --stat 8ea548b main
```

Saída:

```text
 .agents/agents/gemini-cto/agent.md          |  47 +++++++
 .agents/agents/gemini-dev-backend/agent.md  |  42 ++++++
 .agents/agents/gemini-dev-frontend/agent.md |  40 ++++++
 .agents/agents/gemini-fixer/agent.md        |  32 +++++
 .agents/agents/gemini-qa/agent.md           |  34 +++++
 .agents/agents/gemini-revisor/agent.md      |  32 +++++
 .agents/agents/gemini-tutor/agent.md        |  34 +++++
 GEMINI.md                                   | 128 +++++++++++++++++
 docs/historico/delegacao/2026-11-19-gemini.md         | 211 ++++++++++++++++++++++++++++
 9 files changed, 600 insertions(+)
```

Nenhum desses 9 arquivos é tocado pela branch `origin/pendente/zen-mayer-E1-E2` (conferido contra `git diff --stat 8ea548b origin/pendente/zen-mayer-E1-E2`, que altera 68 arquivos sem interseção).

**3. Simulação de merge com `main`:**

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" merge-tree --write-tree main origin/pendente/zen-mayer-E1-E2
```

Saída:

```text
29feaf91c16e5822c2be63ebbc0fd6c9bd20fd95
EXIT_MAIN=0
```

Resultado: **0 conflitos** de merge contra `main` (`6b0ca36`, base desta branch de auditoria). *(Nota de conferência do CTO: após o merge do PR #21 em `main` — `643cedd`, `chore/skill-caveman` —, `git merge-tree --write-tree main origin/pendente/zen-mayer-E1-E2` foi reexecutado e continuou com exit `0`, tree `d279587fc078c87025329ad58fd6192867629b53`, 0 conflitos.)*

**4. Simulação de merge com `docs/E1-T1.3-cartao` (`597b1e5`):**

```powershell
git -C "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini" merge-tree --write-tree docs/E1-T1.3-cartao origin/pendente/zen-mayer-E1-E2
```

Saída:

```text
b68efbc00a5b4fd85dfa4e05f44f648aac14b963
100644 b5bd2d2de7745444aa2d795dff836e63f8c3636a 2	docs/tasks/E1/T1.3.md
100644 3383c06a930594f1e5d2cc17b907ab44652cc77b 3	docs/tasks/E1/T1.3.md

Auto-merging docs/decisoes/README.md
Auto-merging docs/tasks/E1/T1.3.md
CONFLICT (add/add): Merge conflict in docs/tasks/E1/T1.3.md
EXIT_CARTAO=1
```

Resultado: **1 conflito (`add/add`) em `docs/tasks/E1/T1.3.md`**. O arquivo `docs/decisoes/README.md` fez auto-merge limpo (verificado com `git cat-file -p b68efbc00a5b4fd85dfa4e05f44f648aac14b963:docs/decisoes/README.md`: mantém `0020` e `0021` na tabela de decisões aceitas e `0022` na seção `## Propostas (aguardam o dono)`).

### 1.2 Numeração de ADRs e conflitos semânticos

- Em `main` (`6b0ca36`), os arquivos em `docs/decisoes/` vão até `0019-base-do-app-e2.md`.
- A branch `zen-mayer` adiciona `0020-regras-e1-parte-b.md` (E1 parte B) e `0021-banco-e2.md` (banco E2), ambas marcadas como `aceita` pelo CTO em 18/11/2026 sem PR em `main`.
- A branch `docs/E1-T1.3-cartao` (`597b1e5`) propõe `0022-identidade-detalhes-t1.3.md`, pulando deliberadamente `0020` e `0021` justamente para evitar colisão numérica caso o dono aproveite a `zen-mayer` (`docs/decisoes/0022-identidade-detalhes-t1.3.md:8`).
- **Conclusão de choques globais:** não há colisão de números de ADR nem conflito textual com `main`, mas há (a) **conflito `add/add` em `docs/tasks/E1/T1.3.md`** com o cartão novo da equipe Claude, (b) **status divergente de governança** (0020 e 0021 marcadas como aceitas fora de `main`, enquanto 0022 está proposta), e (c) **falta de ADR/emenda** para o bump do `next` em `T2.1s` (G2 item 8).

---

## 2. Avaliação tarefa por tarefa

> **Nota sobre ancestralidade ("casos antes do código"):** todas as verificações de ordem abaixo foram confirmadas não só por timestamp, mas pela cadeia real de pais em `git log --graph --format="%h %P | %ai | %s" main..origin/pendente/zen-mayer-E1-E2` e pelos diffs de `tests/` entre o commit de teste e o commit de implementação.

---

### 2.1 `T1.3` — Identidade e dedup com `existingCounts`

1. **Cartão:** existe em `docs/tasks/E1/T1.3.md` (135 linhas). Seções preenchidas:
   - Cartão: CTO (`694310a`).
   - Relatório do agente: `dev-backend` (`6c9de9a`, rodada 1 em `6af3420`, rodada 2 em `b7bc0a2`).
   - Verificação do QA: `qa` (`a76a82d`, veredito `PASS` com 2 bugs baixa `BUG-T1.3-01` e `BUG-T1.3-02`, depois corrigidos).
   - Revisão do revisor: `revisor` (`fb917d5`, veredito `APROVADO`, 2 achados baixa corrigidos na rodada 2).
   - Revisão do CTO: `cto` (`fb917d5`, aprovado em 18/11/2026).
   - **Aprovação do dono:** os casos da seção C em `docs/tasks/E1/T1.0.md` já têm aprovação do dono registrada em `main` (15/10/2026), mas a entrega da T1.3 não passou por PR nem tem aprovação/merge do dono em `main`.
2. **Casos antes do código:** **SIM.** Cadeia causal comprovada por pais:
   - `694310a` (cartão T1.3, pai `8ea548b`) → `8148e59` (`test(E1/T1.3)`, pai `694310a`, toca **só** `tests/domain/transactions/identity.test.ts`) → `6c9de9a` (`feat(E1/T1.3)`, pai `8148e59`).
   - `git diff --stat 8148e59 6c9de9a -- tests/domain/transactions/identity.test.ts`: **vazio** (nenhum caso alterado ao implementar).
   - A única mudança posterior em `tests/domain/transactions/identity.test.ts` foi na rodada 2 (`b7bc0a2`, pai `6af3420`): trocou NBSP literal por `String.fromCharCode(0xa0)` e **adicionou** testes de `identityKey` inválido e `2 ** 60` em `complete` (sem alterar nem enfraquecer casos C).
3. **Conformidade com a spec:**
   - **Conforme** com `docs/spec/Fase0_roteiro.md` (Tarefa 3), `docs/spec/Meu_financeiro.md` (seção 5.4), `CLAUDE.md`, ADR-0018 (itens 7–11) e seção C de `docs/tasks/E1/T1.0.md`:
     - `domain/transactions/identity.ts:16-23` implementa `normalizeText` com `normalize('NFD')`, `\p{M}`, `.toLowerCase()`, `\p{White_Space}+` e `.trim()` (mantendo pontuação).
     - `domain/transactions/identity.ts:26-35` monta `baseKeyInput` exatamente como `JSON.stringify([t.source, t.accountRef, t.date, t.time ?? null, t.amount, normalizeText(t.description)])` (deixando de fora `externalId`, `merchantName`, `status`, `type`, `postedAt` e `itemId`).
     - `domain/transactions/identity.ts:41-46` valida `Number.isSafeInteger(occurrence) && occurrence >= 1` em `identityKey` e usa `hash(JSON.stringify([bk, occurrence]))`.
     - `domain/transactions/identity.ts:54-87` valida `mode`, todas as entradas de `existingCounts` com `Number.isSafeInteger(count) && count >= 0`, e a `occurrence` calculada com `Number.isSafeInteger(occurrence)`; não muta lote/mapa; preserva ordem e referência (`tx`); mensagens de erro fixas sem ecoar valores; hash injetado (zero imports de `node:*`, G2 item 3 `OK`).
     - `domain/transactions/index.ts:1-10` reexporta `assignIdentities`, `baseKey`, `baseKeyInput`, `identityKey`, `normalizeText`, `Hash`, `IdentifiedTransaction` e `Mode` — idêntico ao exigido pelo cartão novo (`docs/E1-T1.3-cartao`).
   - **Desvios contra o cartão novo (`docs/E1-T1.3-cartao:docs/tasks/E1/T1.3.md`) e processo:**
     - **Cobertura dos casos C2 (ADR-0022) na suíte do dev:** o código de `domain/transactions/identity.ts` já satisfaz tecnicamente todos os pontos da ADR-0022 (U+0085, inteiros seguros em `existingCounts`/`identityKey`/`assignIdentities`, nomes exportados), porém `tests/domain/transactions/identity.test.ts` **não** cobre todos os 14 casos `C2.1` a `C2.14` (vários existem apenas em `tests/qa/identity-qa.test.ts`, não no arquivo do dev; ex.: C2.1 U+0085, C2.2 U+202F/U+3000, C2.3 U+200B, C2.4 NFC vs NFD, C2.5 `0`/`-0`, C2.6 duas contas, C2.7 `Infinity`/`'2'`/`null` em ambos os modos, C2.8 `{A: 0}`, C2.9 chave inválida fora do lote, C2.10 `2 ** 53`, C2.11 `MAX_SAFE_INTEGER - 1` em `incremental`, C2.12 `mode` `undefined`/`''`/`'COMPLETE'`, C2.13 verificação de que as mensagens de erro não ecoam dados, C2.14 13 linhas contra 12).
     - Na rodada 1 (`6af3420`), o dev editou `tests/qa/identity-qa.test.ts` (trocar `it.fails` por `it` — aceito pelo CTO na sessão, mas fora da área padrão do dev).
4. **Dependências:** **Nenhuma fora de `main`.** Importa somente `./transaction` (`domain/transactions/identity.ts:1`), que já está em `main` (T1.0, T1.1, T1.2, ADR-0018). Depende apenas da decisão do dono sobre a ADR-0022 proposta em `docs/E1-T1.3-cartao`.
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main`. **Conflito `add/add` em `docs/tasks/E1/T1.3.md`** com `docs/E1-T1.3-cartao` (`597b1e5`).
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. Substituir `docs/tasks/E1/T1.3.md` da `zen-mayer` pelo cartão novo de `docs/E1-T1.3-cartao` (com a decisão do dono sobre a ADR-0022).
     2. Se a ADR-0022 for aprovada: completar `tests/domain/transactions/identity.test.ts` com os casos `C2.1` a `C2.14` faltantes. Se a ADR-0022 for rejeitada: ajustar `identity.ts` e testes ao escopo estrito da seção C da T1.0.
     3. Integrar em PR próprio sobre `main` (incluindo `tests/qa/identity-qa.test.ts`), com revisão de `qa`, `revisor` e `cto`.

---

### 2.2 `T1.5` — Casos de teste das regras de relatório (e ADR-0020)

1. **Cartão:** existe em `docs/tasks/E1/T1.5.md` (171 linhas), acompanhado por `docs/decisoes/0020-regras-e1-parte-b.md` (61 linhas) e entrada no índice `docs/decisoes/README.md:26`.
   - Cartão e casos (seções D, E, F e G): preenchidos pelo CTO (`a4799f8`).
   - Registro de aprovação: escrito pelo CTO (`a266bb7`).
   - Acréscimos posteriores pelo CTO: nota sobre `refund`+`isTransfer` em `T1.5.md:83` (`4a9e87e`); esclarecimentos 19–21 em `0020-regras-e1-parte-b.md:50-54` (`3744644`, `5b06c57`); esclarecimento 22 em `0020-regras-e1-parte-b.md:56` (`6b84bd5`, `f31f181`).
   - QA / revisor: não se aplicam (não há código, conforme `docs/tasks/E1/T1.5.md:7`).
   - **Aprovação do dono:** `docs/tasks/E1/T1.5.md:9,169-171` e `docs/decisoes/0020-regras-e1-parte-b.md:3` contêm o registro feito pelo CTO (*"Aprovado pelo dono em 18/11/2026 ('Aprovo'), registrado pelo CTO"*, commit `a266bb7`, autor `Claude`). Porém, **não há PR aprovado nem registro em `main`**, e os esclarecimentos 19–22 da ADR-0020 foram acrescentados depois sem nova aprovação explícita do dono. Portanto, **permanece pendente de confirmação formal do dono em `main`**.
2. **Casos antes do código:** **SIM (como especificação prévia).** Na árvore de commits:
   - `a4799f8` (proposta T1.5 + ADR-0020, pai `694310a`) → `a266bb7` (marcação de aprovação da T1.5 + ADR-0020, pai `a4799f8`).
   - Todos os commits de testes e código de T1.6 (`2422e93`, pai `a266bb7`), T1.8 (`7dc1302`, pai `6c51cd8` → pai2 `d41572f` → `a266bb7`) e T1.7 (`76bac37`, ancestral `4a9e87e` → ... → `a266bb7`) são descendentes diretos de `a266bb7`.
3. **Conformidade com a spec:**
   - Cobre as Tarefas 5, 6 e 7 de `docs/spec/Fase0_roteiro.md` e as seções 5.3, 5.5, 5.6 e 5.7 de `docs/spec/Meu_financeiro.md`, fixando contratos inequívocos (período fechado civil, `SpendingItem`/`SpendingSummary`, desempate guloso de transferências, ordem de prioridade e especificidade no categorizador).
   - **Ponto de atenção / desvio parcial documentado:** o roteiro (Tarefa 6, `docs/spec/Fase0_roteiro.md:234`) pede *"Pagamento maior que a fatura ⇒ sinalizar a diferença, nunca contar como despesa"*. A ADR-0020 item 6 (`docs/decisoes/0020-regras-e1-parte-b.md:27`) garante que nunca conta como despesa, mas **adia a sinalização da diferença para o E3** (porque exige o valor da fatura vindo da Pluggy). Decisão tecnicamente coerente, mas exige validação expressa do dono.
4. **Dependências:** **Nenhuma fora de `main`** (depende de T1.2 em `main`, conforme `ROADMAP.md:131`).
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main`; auto-merge limpo em `docs/decisoes/README.md` com `docs/E1-T1.3-cartao` (ADR-0020 não colide com ADR-0022).
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. Submeter `T1.5.md` + `0020-regras-e1-parte-b.md` (já consolidada com a nota de `refund`+`isTransfer` e os esclarecimentos 19–22) em PR próprio para confirmação formal do dono em `main` antes dos PRs de T1.6–T1.8.
     2. Colher aceite explícito do dono para o adiamento da sinalização de pagamento a maior da fatura para o E3 (ADR-0020 item 6) e para o desempate final por índice em casos idênticos (ADR-0020 item 22).

---

### 2.3 `T1.6` — Gastos do período e datas civis

1. **Cartão:** existe em `docs/tasks/E1/T1.6.md` (113 linhas). Seções preenchidas:
   - Cartão: CTO (`a266bb7`).
   - Relatório do agente: `dev-backend` (`8122c1a`).
   - Verificação do QA: `qa` (`c122395`, veredito `PASS`, 1 bug baixa `BUG-T1.6-01` documentado como `it.fails`).
   - Revisão do revisor: `revisor` (`4a9e87e`, veredito `APROVADO`, 3 sugestões).
   - Revisão do CTO: `cto` (`4a9e87e`, aprovado em 18/11/2026).
   - **Aprovação do dono:** nenhuma registrada em `main` (sem PR).
2. **Casos antes do código:** **SIM.** Cadeia causal comprovada por pais:
   - `a266bb7` (T1.5 + cartão T1.6) → `2422e93` (`test(E1/T1.6)`, pai `a266bb7`, toca **só** `tests/domain/dates/dates.test.ts` e `tests/domain/reports/spending.test.ts`) → `8122c1a` (`feat(E1/T1.6)`, pai `2422e93`).
   - `git diff --stat 2422e93 8122c1a -- tests/`: **vazio** (nenhum teste alterado após a implementação).
3. **Conformidade com a spec:**
   - **Conforme** com `docs/spec/Fase0_roteiro.md` (Tarefa 6), `docs/spec/Meu_financeiro.md` (seções 5.3, 5.5, 5.6), `CLAUDE.md`, T1.5 (seções D e E) e ADR-0020 (itens 1–8 e 18):
     - `domain/dates/dates.ts` calcula datas civis por aritmética pura (época civil, era de 400 anos, sem `Date`); mensagens de erro fixas sem ecoar entrada.
     - `domain/reports/spending.ts` usa exclusivamente `add`, `negate` e `cents` de `domain/money` (`:5,40-91`), nunca `+` cru; `credit_card_payment` (`:68-70`) e `investment` (`:71-74`) ficam fora de `expenses` e `income`; `isTransfer` vence o tipo (`:54-57`); `pending` entra normalmente; `refund` subtrai de `expenses` (`:62-64`); `transfer` sem par e `other` vão para `unclassified` (`:75-79`); validação de toda transação via `validateTransaction` (`:50-52`).
     - Zero imports de I/O em `domain/` (G2 item 3 `OK`); ocorrências de `Math.floor` em `domain/dates/dates.ts:29,32,34` são aritmética de calendário, não dinheiro (G2 item 4 `OK`).
   - **Desvios / achados:**
     1. **`BUG-T1.6-01` (`tests/qa/spending-qa.test.ts:486-511`, `it.fails`):** com `MAX = Number.MAX_SAFE_INTEGER`, `[despesa -MAX, despesa -1, estorno +2]` lança `out_of_range` em algumas ordens e retorna `MAX - 1` em outras, porque `spendingForPeriod` acumula passo a passo via `add` (`domain/reports/spending.ts:63`), herdando o comportamento de `sum` (caso A.5 da T1.0 / ADR-0018 item 1). O CTO registrou como risco aceito (~R$ 90 trilhões), mas deixou um `it.fails` na suíte; o dono precisa confirmar o aceite (ou pedir acumulação em `bigint` com checagem final via ADR).
     2. **`default: never` ausente no commit original da T1.6:** na `zen-mayer`, o `default` exaustivo em `domain/reports/spending.ts:80-84` só foi adicionado depois, no commit `a25325d` (dentro da T1.7). Ele pertence à T1.6 e deve entrar já no PR da T1.6.
     3. **`domain/dates/dates.ts:19`:** `daysInMonth` valida `Number.isInteger(year)` em vez de `Number.isSafeInteger(year)` (risco menor e restrito a chamadas diretas a `daysInMonth`, pois `parseCivilDate` usa regex de 4 dígitos).
     4. **Comportamento adicional sem caso na suíte do dev:** `spendingForPeriod` lança `Error` se `period.start > period.end` (`domain/reports/spending.ts:36-38`, testado apenas no QA em `tests/qa/spending-qa.test.ts`, não em `tests/domain/reports/spending.test.ts`).
4. **Dependências:** **Depende de `T1.5` + ADR-0020 (fora de `main`).** No código, `domain/reports/spending.ts:4-6` importa apenas `../dates`, `../money` e `../transactions` (`validateTransaction`, `NormalizedTransaction` — já em `main`). Embora o código não importe `identity.ts`, o `ROADMAP.md:132` lista `T1.3` como dependência da T1.6 (manter T1.3 antes no plano de PRs respeita a separação E1 parte A → parte B).
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`.
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. Entrar somente após PRs de `T1.3` (fechando parte A) e `T1.5` + ADR-0020 aprovada pelo dono.
     2. Incorporar já neste PR o `default: never` de `domain/reports/spending.ts:80-84` (trazido de `a25325d`, desvinculando-o da T1.7).
     3. Confirmar decisão do dono sobre `BUG-T1.6-01` (manter `it.fails` como risco aceito ou mudar para soma em `bigint` mediante ADR).
     4. (Recomendado) Trocar `Number.isInteger(year)` por `Number.isSafeInteger(year)` em `domain/dates/dates.ts:19` e adicionar caso de período invertido em `tests/domain/reports/spending.test.ts`.

---

### 2.4 `T1.7` — Transferências internas (`detectTransfers`)

1. **Cartão:** existe em `docs/tasks/E1/T1.7.md` (123 linhas). Seções preenchidas:
   - Cartão: CTO (`4a9e87e`).
   - Relatório do agente: `dev-backend` (`a25325d`, rodada 1 em `e4e5920`).
   - Verificação do QA: `qa` (`2de3d34`, veredito `PASS` com 1 bug média `BUG-T1.7-01`, corrigido na rodada 1).
   - Revisão do revisor: `revisor` (`f31f181`, veredito `APROVADO`, 1 achado baixa aceito na ADR-0020 item 22).
   - Revisão do CTO: `cto` (`f31f181`, aprovado em 18/11/2026).
   - **Aprovação do dono:** nenhuma registrada em `main` (sem PR).
2. **Casos antes do código:** **SIM.** Cadeia causal comprovada por pais:
   - `4a9e87e` (cartão T1.7) → `76bac37` (`test(E1/T1.7)`, pai `4a9e87e`, toca **só** `tests/domain/transfers/detect.test.ts`) → `01ae924` (`feat(E1/T1.7)`, pai `76bac37`) → `a11416e` (`feat(E1/T1.7)`, usa `negate` de `domain/money` + reformatação Prettier de 1 linha em `tests/domain/transfers/detect.test.ts:122`, sem alterar nenhum caso ou asserção) → `a25325d` (`refactor(E1/T1.7)`) → `e190999` (QA) → `e4e5920` (`fix(E1/T1.7)` BUG-T1.7-01).
3. **Conformidade com a spec:**
   - **Conforme** com `docs/spec/Fase0_roteiro.md` (Tarefa 5), `docs/spec/Meu_financeiro.md` (seção 5.5), `CLAUDE.md`, T1.5 (seção F) e ADR-0020 (itens 9–12 e 22):
     - `domain/transfers/detect.ts:60-95` pareia apenas tipos elegíveis (`transfer`, `expense`, `income`, `other`), contas distintas, sinais opostos via `negate(inn.amount)`, valor ≠ 0, `|daysBetween| <= windowDays`, cada perna em no máximo 1 par; desempate determinístico por `(daysApart, outDate, inDate, outText, inText)` onde `canonical(tx) = JSON.stringify([baseKeyInput(tx), tx.type, tx.externalId ?? ''])` (`:26-28`, corrigindo `BUG-T1.7-01`); confiança `high` somente com ambas as pernas `transfer` e `daysApart <= 1`; saída ordenada por `outflowIndex`.
   - **Desvios / achados:**
     1. **Escopo misturado no commit `a25325d` (`domain/reports/spending.ts` e `domain/transactions/transaction.ts`):** o CTO embutiu manutenção de duas tarefas anteriores dentro da T1.7. Alterar `domain/transactions/transaction.ts` (T1.2, já em `main`) para importar `daysInMonth` de `../dates` (T1.6) faz `domain/transactions/` (E1 parte A) passar a depender de `domain/dates/` (E1 parte B) e mistura manutenção de outras regras no PR de `detectTransfers` (contrariando a separação de 1 PR por regra financeira e o princípio de não mexer em módulos fechados na mesma entrega, spec 4.5).
     2. **`domain/transfers/detect.ts:56`:** valida `Number.isInteger(windowDays)` em vez de `Number.isSafeInteger(windowDays)` (menor; `2 ** 60` passaria).
     3. **Edição em `tests/qa/transfers-qa.test.ts` na rodada 1 (`e4e5920`):** o dev trocou o `it.fails` do `BUG-T1.7-01` por `it` (autorizado na rodada, mas fora da área padrão do dev).
     4. **Desempate residual por índice (`domain/transfers/detect.ts:41-42`):** quando duas linhas diferem só em `status`, `postedAt`, `merchantName` ou caixa da descrição, o índice desempata (registrado como risco aceito na ADR-0020 item 22, aguardando aval do dono).
4. **Dependências:** **Depende de `T1.3`, `T1.5` (com ADR-0020 incluindo item 22) e `T1.6` — todas fora de `main`.** Imports reais em `domain/transfers/detect.ts:4-6`: `../dates` (`daysBetween`), `../money` (`negate`) e `../transactions` (`baseKeyInput`, `NormalizedTransaction`, `TransactionType`).
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`.
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. **Retirar o commit `a25325d` do PR da T1.7:** mover `default: never` em `domain/reports/spending.ts` para o PR da `T1.6`, e separar (ou descartar, conforme decisão do dono) a alteração em `domain/transactions/transaction.ts` para não acoplar `domain/transactions/` a `domain/dates/` dentro da T1.7.
     2. Entrar após `T1.3`, `T1.5` (com item 22 da ADR-0020 aprovado) e `T1.6`.
     3. (Recomendado) Trocar `Number.isInteger(windowDays)` por `Number.isSafeInteger(windowDays)` em `domain/transfers/detect.ts:56`.

---

### 2.5 `T1.8` — Categorizador (`categorize`)

1. **Cartão:** existe em `docs/tasks/E1/T1.8.md` (103 linhas). Seções preenchidas:
   - Cartão: CTO (`a266bb7`).
   - Relatório do agente: `dev-backend` (`9369800`).
   - Verificação do QA: `qa` (`614d706`, veredito `PASS`, 0 bugs de código, 3 riscos de decisão para o CTO).
   - Revisão do revisor: `revisor` (`5b06c57`, veredito `APROVADO`).
   - Revisão do CTO: `cto` (`5b06c57`, aprovado em 18/11/2026).
   - **Aprovação do dono:** nenhuma registrada em `main` (sem PR).
2. **Casos antes do código:** **SIM.** Cadeia causal comprovada por pais:
   - `6c51cd8` (merge trazendo `a266bb7` com T1.5 e cartão T1.8) → `7dc1302` (`test(E1/T1.8)`, pai `6c51cd8`, toca **só** `tests/domain/categories/categorize.test.ts`) → `9369800` (`feat(E1/T1.8)`, pai `7dc1302`).
   - `git diff --stat 7dc1302 9369800 -- tests/`: **vazio** (nenhum caso alterado após a implementação).
3. **Conformidade com a spec:**
   - **Conforme** com `docs/spec/Fase0_roteiro.md` (Tarefa 7), `docs/spec/Meu_financeiro.md` (seção 5.7), `CLAUDE.md`, T1.5 (seção G) e ADR-0020 (itens 13–17 e 19–21):
     - `domain/categories/categorize.ts:53-56` garante que `investment` sempre vai para `investmentCategoryId` (nem regra do usuário o move para categoria de gasto) e `credit_card_payment`/`transfer` vão para `transferCategoryId`, ambos com `reason: 'type'`.
     - Ordem exata: `type` → `user_rule` → `known_merchant` → `source_category` → `heuristic` → `fallback` (`:53-92`).
     - `bestMatch` (`:33-45`) casa por palavra inteira com espaço (` ${text} `.includes(` ${pattern} `)), ignora padrões vazios/só espaços, vence o padrão normalizado mais longo e desempata pelo primeiro da lista; usa `normalizeText` sobre `description` e `merchantName`; devolve `reason` e `pattern` normalizado.
   - **Pontos de atenção (esclarecimentos 19–21 da ADR-0020):** `"UBER*TRIP"` sem espaço cai no próximo nível (falha segura → `Outros`), sem prioridade entre `description` e `merchantName`, e `sourceCategoryMap` faz busca exata. Não são bugs do código, mas dependem da aprovação da ADR-0020 (com itens 19–21) no PR da T1.5.
4. **Dependências:** **Depende de `T1.3` (`normalizeText`) e `T1.5` + ADR-0020 — ambas fora de `main`.** Import real em `domain/categories/categorize.ts:4`: `import { normalizeText, type NormalizedTransaction } from '../transactions'`. *(Observação: `ROADMAP.md:134` lista apenas `T1.5, T1.2`, mas o código real depende também de `T1.3`, o que o cartão `docs/tasks/E1/T1.8.md:8` registra corretamente.)*
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`.
6. **Veredito:** **`APROVEITAR`** — Código e testes (dev e QA) estão limpos, sem defeitos e sem arquivos fora do escopo; entra em PR próprio logo após `T1.3` e `T1.5`/ADR-0020 (com revisão formal de `qa`, `revisor` e `cto`).

---

### 2.6 `T2.1s` — Subir o Next para 16.4.6 (correção de segurança)

1. **Cartão:** existe em `docs/tasks/E2/T2.1s.md` (65 linhas). Seções preenchidas:
   - Cartão: CTO (`d41572f`, registra *"Subida aprovada pelo dono em 18/11/2026"*).
   - Relatório do agente: `dev-backend` (`766aff5`).
   - **Verificação do QA: AUSENTE** (não existe seção de QA no cartão; pulou a etapa `qa` da cadeia `dev → qa → revisor → cto → dono` em `CLAUDE.md:9`).
   - Revisão do revisor: `revisor` (`fb6bf2a`, veredito `APROVADO`, mas rodou só 1 build em vez de 3 e marcou o aviso oficial de segurança do Next como `[VERIFICAR]`).
   - Revisão do CTO: `cto` (`fb6bf2a`, aprovado em 18/11/2026).
   - **Aprovação do dono:** mencionada no texto do cartão pelo CTO, mas **sem ADR/emenda em `docs/decisoes/`** e sem PR em `main`.
2. **Casos antes do código:** Não se aplica (manutenção de dependência de segurança, não regra financeira).
3. **Conformidade com a spec e `CLAUDE.md`:**
   - **Quebra de regra do `CLAUDE.md:12` (confirmada no G2 item 8 como `PROBLEMA`):** `package.json:38` alterou `"next": "^16.4.1"` para `"^16.4.6"` (`1a18c51`) **sem criar ADR nem registrar emenda em `docs/decisoes/0019-base-do-app-e2.md`**.
   - **Diff de lockfile limpo:** confirmado via `git diff d5303ee 1a18c51 -- pnpm-lock.yaml` que apenas `next`, `@next/env` e os 8 pacotes `@next/swc-*` subiram de `16.4.1` para `16.4.6`; `react` e `react-dom` permaneceram em `19.3.1`.
   - **Lacunas de verificação:** (a) critério `/entrar` → 200 falhou com `404` no relatório do dev (`docs/tasks/E2/T2.1s.md:48`) porque a T2.5 não estava na base da branch; (b) QA não rodou; (c) aviso oficial de segurança do Next ficou `[VERIFICAR]`; (d) foi mesclada junto com `T2.2` no commit `88e5928` (`merge(E2/T2.2, T2.1s)`).
4. **Dependências:** **Nenhuma dependência técnica fora de `main`** (depende apenas de T2.1, já em `main`). Na `zen-mayer`, a branch `agent/T2.1s-backend` nasceu sobre `T2.2` apenas para evitar conflito em `package.json`/`pnpm-lock.yaml`. No plano de PRs, faz sentido entrar **antes** de `T2.2` e `T2.5`, pois elimina o `SecurityFatalError` que quebrava `pnpm build` nessas tarefas.
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`. Se entrar antes de `T2.2`, o `pnpm-lock.yaml` da `T2.2` será gerado já sobre `next@16.4.6`.
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. Registrar emenda na `docs/decisoes/0019-base-do-app-e2.md` (ou ADR própria) aprovada pelo dono antes/junto do PR (`CLAUDE.md:12`).
     2. Abrir em PR próprio, desacoplado de `T2.2`, contendo apenas `package.json` (linha do `next`), `pnpm-lock.yaml`, emenda de ADR e cartão.
     3. Executar QA independente (confirmando 3 execuções de `pnpm build` sem `SecurityFatalError` e conferindo o aviso oficial de segurança do Next, hoje `[NÃO VERIFICADO]`).
     4. Decidir com o dono se mantém `^16.4.6` ou trava o minor com `~16.4.6`.

---

### 2.7 `T2.2` — Schema Drizzle, migrações e RLS (e ADR-0021)

1. **Cartão:** existe em `docs/tasks/E2/T2.2.md` (164 linhas) + `docs/decisoes/0021-banco-e2.md` (15 linhas). Seções preenchidas:
   - Cartão e ADR-0021: CTO (`a266bb7`, registra *"Dependências aprovadas pelo dono em 18/11/2026 ('Aprovo as 3')"*).
   - Relatório do agente: `dev-backend` (`ae9b474`, rodada 1 em `2aeaa71`, rodada 2 em `30e86df`).
   - Verificação do QA: `qa` (`c9a2bd8`, veredito **`FAIL`** por `BUG-T2.2-QA-01`: `transactions.type` sem CHECK). **Não há nova seção do QA após as rodadas 1 e 2.**
   - Revisão do revisor: `revisor` (`fb6bf2a`, veredito `APROVADO` sobre rodada 1, apontando `transactions.type` aceitando `NULL` e `currency` sem CHECK `BRL`, corrigidos na rodada 2 sem novo parecer separado do revisor após `30e86df`).
   - Revisão do CTO: `cto` (`fb6bf2a`, aprovado em 18/11/2026).
   - **Aprovação do dono:** mencionada no texto da ADR-0021 pelo CTO, mas sem PR nem aprovação em `main`.
2. **Casos antes do código:** Não é regra financeira de E1 (o cartão fixa casos estáticos e de integração; no histórico, `8660028` com testes veio após `48d7b1a` com schema/migrações).
3. **Conformidade com a spec (`docs/spec/Meu_financeiro.md` seções 6, 10, 14; `CLAUDE.md`; ADR-0021):**
   - **Pontos conformes (comprovados em G2 e leitura direta):**
     - As 11 tabelas da spec 10 existem em `lib/database/schema.ts` e `drizzle/0000_schema_inicial.sql`.
     - Todas as 6 colunas monetárias (`accounts.balance`, `accounts.available_balance`, `accounts.reconciliation_diff`, `holdings.balance`, `import_items.parsed_amount`, `transactions.amount`) são `bigint` no SQL e `bigint(..., { mode: 'bigint' })` em `lib/database/schema.ts:27` (G2 item 5 `OK`).
     - RLS: `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY` nas 11 tabelas (`drizzle/0001_rls.sql`), 0 `CREATE POLICY` (G2 item 6 `OK`).
     - Índice único `(account_id, identity_key)` e `identity_key NOT NULL` (`lib/database/schema.ts:148,170`); `ON DELETE RESTRICT` em todas as FKs; `transactions.type NOT NULL` com CHECK dos 8 valores da spec 5.2 e `currency IN ('BRL')` (`drizzle/0002_transactions_type_check.sql`, `drizzle/0003_transactions_type_currency.sql`).
     - `lib/database/client.ts:12` usa `prepare: false` e `env().DATABASE_URL`; nenhum arquivo de `app/` o importa ainda.
     - `drizzle.config.ts:5-10` exige `DATABASE_URL_MIGRATIONS` nomeando a variável sem ecoar valor.
   - **Desvios, lacunas e riscos encontrados:**
     1. **Divergência `transactions.posted_at` (`lib/database/schema.ts:151` vs `domain/transactions/transaction.ts:27,145` e `T1.0.md:210`):** no domínio (T1.2, já em `main`), `postedAt` é validado como **data civil `YYYY-MM-DD`** (`isCivilDate`), e a spec 5.3 descreve `posted_at` como *"data de lançamento/efetivação"*. Porém, `lib/database/schema.ts:151` e `drizzle/0000_schema_inicial.sql:138` definiram `posted_at` como `timestamp with time zone` (`timestamptz`), diferente de `date` (`mode: 'string'`). Precisa de alinhamento explícito (mudar para `date` ou documentar conversão/motivo em ADR).
     2. **36 testes contra Postgres real NÃO rodaram nesta auditoria (`[NÃO VERIFICADO]` em Postgres real):** `tests/integration/migration.test.ts:27` (4 testes) e `tests/qa/database-qa.test.ts:34` (32 testes) foram pulados no G2 (item 1 e item 2 `PARCIAL`) por ausência de `TEST_DATABASE_URL`. A execução real relatada no cartão foi feita num cluster local temporário da sessão `zen-mayer`, não reproduzida aqui nem no CI.
     3. **`RISCO-T2.2-QA-02` (`tests/qa/database-qa.test.ts:330-343`, `it.fails`):** FKs simples permitem inserir uma transação com `user_id` de um usuário apontando para `account_id` de outro. Risco aceito pelo CTO na sessão (app single-user, só servidor acessa), mas mantém um `it.fails` na suíte e precisa de aceite explícito do dono.
     4. **`.gitignore` alterado fora da lista de arquivos permitidos do cartão (`c78d21d`):** `docs/tasks/E2/T2.2.md:26-34` não listou `.gitignore`, mas `.gitignore` em `main` bloqueava `*.[sS][qQ][lL]` (o dev precisou forçar `git add` em `6a31ab7` até o CTO adicionar `!/drizzle/*.sql` em `c78d21d`).
     5. **Edição do dev em arquivo do QA (`tests/qa/database-qa.test.ts:109`, commit `30e86df`):** na rodada 2, tornar `transactions.type NOT NULL` quebrou 17 testes do QA que usavam `type = null`; o dev alterou 1 linha do arquivo do QA (`type = 'other'`, fora da área do dev, sinalizado no relatório), e **nem QA nem revisor reexecutaram formalmente** após `30e86df`.
     6. **Migrações fragmentadas (`0000` + `0001` + `0002` + `0003`):** como nada foi aplicado em produção nem mesclado em `main`, `0002` e `0003` apenas remendam colunas criadas em `0000`. Consolidar em `0000` (schema inicial já correto) + `0001` (RLS) antes do primeiro merge deixa o histórico de migrações limpo.
     7. **Consistência menor e trava `server-only`:** `accounts.currency` (`schema.ts:91`) e `holdings.currency` (`schema.ts:277`) não têm CHECK `'BRL'` (enquanto `transactions.currency` tem); `lib/database/client.ts` ainda não tem proteção de importação `server-only` (relevante com Client Components da T2.5); `pnpm-workspace.yaml` (`allowBuilds: { esbuild: false }`) requer ciência explícita do dono/CTO; unicidade em `accounts (connection_id, external_account_id)` e lock de `sync_logs` ficaram pendentes para T2.8/E3.
     8. **Merge misturado (`88e5928`):** na `zen-mayer`, `T2.2` foi mesclada junto com `T2.1s`.
4. **Dependências:** **Nenhuma dependência técnica fora de `main`** (depende de T2.1, já em `main`, e aprovação formal da ADR-0021 pelo dono). Recomenda-se entrar **depois de `T2.1s`** para o `pnpm-lock.yaml` já nascer sobre `next@16.4.6` e `pnpm build` passar de primeira.
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main`; auto-merge limpo em `docs/decisoes/README.md` com `docs/E1-T1.3-cartao` (ADR-0021 não colide com ADR-0022).
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. Aprovação formal do dono para a ADR-0021 (`drizzle-orm`, `postgres`, `drizzle-kit`), para `pnpm-workspace.yaml` (`allowBuilds: { esbuild: false }`) e para o risco aceito `RISCO-T2.2-QA-02` (ou decisão por FKs compostas com `user_id`).
     2. Incluir explicitamente `.gitignore` (`!/drizzle/*.sql`) nos arquivos permitidos do PR e separar `T2.2` de `T2.1s`.
     3. Resolver a divergência de `transactions.posted_at` (`lib/database/schema.ts:151`): alinhar com `date` (como em `domain/transactions/transaction.ts:145`) ou registrar justificativa formal para `timestamptz` em ADR.
     4. Rodar os 36 testes (`tests/integration/migration.test.ts` + `tests/qa/database-qa.test.ts`) e `pnpm db:migrate` contra um Postgres real (Docker) em nova verificação completa de `qa` e `revisor` (incluindo a mudança de `30e86df`).
     5. (Recomendado) Consolidar as migrações `0000`+`0002`+`0003` em `0000_schema_inicial.sql` + `0001_rls.sql` antes do primeiro merge em `main`.

---

### 2.8 `T2.5` — Shell da interface (layout, navegação, tela Entrar)

1. **Cartão:** existe em `docs/tasks/E2/T2.5.md` (126 linhas). Seções preenchidas:
   - Cartão: CTO (`694310a`).
   - Relatório do agente: `dev-frontend` (`73e02ff`, rodada 1 em `f5abd76`).
   - Verificação do QA: `qa` (`d3b0ac4`, veredito **`FAIL`** por `BUG-T2.5-01` — foco cortado na `<nav>` — e `BUG-T2.5-02` — alvo "Painel" com 43,5 px). **Não há nova seção do QA após o fix `f5abd76`.**
   - Revisão do revisor: **dispensado no cartão** (motivo: interface estática, sem dados, sem auth, sem regra financeira; conforme `ROADMAP.md:27`).
   - Revisão do CTO: `cto` (`7193167`, aprovado em 18/11/2026 após conferir o diff da rodada 1 e captura de foco em 390 px).
   - **Aprovação do dono:** nenhuma registrada em `main` (sem PR).
2. **Casos antes do código:** Não se aplica (UI estática, sem biblioteca de testes de componente aprovada).
3. **Conformidade com a spec e design (`docs/design/Login.dc.html`, `Main.dc.html`, `CLAUDE.md`):**
   - **Conforme no visual e na regra de isolamento:** `app/globals.css` usa a paleta exata do design (`#F1F2EC`, `#FAFAF7`, `#D3D8CE`, `#1B2624`, `#3C4A47`, `#5A6763`, `#2A3FB5`, `#0E6B57`) e `:focus-visible` 2px `#2A3FB5`; `app/layout.tsx` carrega Bricolage Grotesque e IBM Plex Sans via `next/font/google` (sem dependência nova); route group `app/(app)/` separa o cabeçalho de `app/entrar/page.tsx`; botão "Entrar com Google" é `<button type="button">` sem lógica (`app/entrar/page.tsx:36-42`); zero valores monetários/fictícios e zero regra financeira nas 5 páginas.
   - **Desvio ALTO — arquivo fora da área permitida (`f5abd76`):** o commit `f5abd76` alterou **`next-env.d.ts`** (`import "./.next/types/..."` → `import "./.next/dev/types/..."`, regenerado pelo `next dev`). `next-env.d.ts` **não** consta na lista de arquivos permitidos de `docs/tasks/E2/T2.5.md:25-33`, e o próprio `README.md:92` (da T2.10) instrui a descartá-lo.
   - **Sugestão menor (não bloqueante):** em `components/navegacao-principal.tsx:21`, `pathname.startsWith(item.href)` pode marcar item ativo por prefixo acidental se surgir rota como `/contas-arquivadas`; preferir `pathname === item.href || pathname.startsWith(`${item.href}/`)`.
   - **Lacuna de processo:** falta re-verificação do QA após `f5abd76` (o cartão ficou com `QA FAIL` registrado).
4. **Dependências:** **Nenhuma dependência fora de `main`** (depende de T2.1 em `main`; beneficia-se de `T2.1s` entrar antes para `pnpm build` não falhar com `SecurityFatalError`).
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`.
6. **Veredito:** **`APROVEITAR COM AJUSTES`**
   - **Ajustes obrigatórios:**
     1. **Reverter a alteração em `next-env.d.ts`** (arquivo fora da área permitida).
     2. Re-executar o QA no PR confirmando a correção de `BUG-T2.5-01` (foco visível sem corte) e `BUG-T2.5-02` (alvo ≥ 44 px) em 390 px e 1280 px, além de `pnpm build` limpo.
     3. (Sugestão não bloqueante) Refinar `startsWith` em `components/navegacao-principal.tsx:21`.

---

### 2.9 `T2.10` — `README.md` de instalação

1. **Cartão:** existe em `docs/tasks/E2/T2.10.md` (122 linhas). Seções preenchidas:
   - Cartão: CTO (`694310a`).
   - Relatório do agente: `fixer` (`d08abef`, rodada 1 em `30263e3`).
   - Verificação do QA: `qa` (`53ec1df`, veredito **`FAIL`** por `BUG-T2.10-01` — frase incorreta sobre a senha padrão do `docker-compose.yml` —, corrigido em `30263e3` sem nova rodada do QA).
   - Revisão do revisor: **dispensado no cartão** (só documentação).
   - Revisão do CTO: `cto` (`63a966e`, aprovado em 18/11/2026 após conferir o diff de texto da rodada 1).
   - **Aprovação do dono:** nenhuma registrada em `main` (sem PR).
2. **Casos antes do código:** Não se aplica (só documentação).
3. **Conformidade com a spec e `CLAUDE.md`:**
   - `README.md` (115 linhas) cobre todas as seções exigidas em português do Brasil: escopo honesto sem prometer o que não existe, requisitos (Node 24, pnpm 12.11.2, Docker opcional), instalação, as 8 variáveis de `.env.example`/`lib/env.ts` (sem nenhum valor real, e-mail real, token ou `itemId` — confirmado em G2 item 7), Postgres local (já com a correção do `BUG-T2.10-01` na linha 39), comandos em blocos `bash` de um comando por bloco, aviso de `next-env.d.ts` (linha 92), estrutura de pastas, privacidade, link para `docs/equipes/AGENTES.md` e `ROADMAP.md`, licença "A definir (E6)".
   - **Ressalvas:**
     1. `cp .env.example .env.local` e `docker compose up -d postgres` ficaram **[NÃO VERIFICADO]** pelo dev e pelo QA (permissão negada / sem daemon Docker), ficando delegados à T6.3 (conforme `docs/tasks/E2/T2.10.md:122`).
     2. O texto de `README.md:3` (*"A tela inicial ainda é provisória"*) e a lista de pastas (`README.md:94-100`, sem `components/` nem `drizzle/`) refletem exatamente o estado de `main` (T2.1). Se entrar **antes** de `T2.2` e `T2.5`, está 100% fiel; se entrar depois, precisará incluir `components/`, `drizzle/` e os scripts `db:generate`/`db:migrate`.
     3. No cartão, o QA ficou registrado como `FAIL` (antes de `30263e3`); uma conferência rápida do QA no PR fecha o `PASS`.
4. **Dependências:** **Nenhuma fora de `main`** (depende apenas de T2.1, já em `main`).
5. **Choques com `main` e trabalho novo:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`.
6. **Veredito:** **`APROVEITAR`** — Pronto para entrar como primeiro PR sobre `main` (antes de `T2.2` e `T2.5`), com conferência rápida do QA validando a correção de `30263e3` e `pnpm format:check`.

---

### 2.10 Commits sem tarefa (`6b84bd5` e `dffb454`)

#### A. Commit `6b84bd5` — `docs(E1): ADR-0020 item 22, tipo no desempate de transferências`

1. **Cartão:** **não possui cartão próprio** (commit direto do CTO na branch base para fundamentar a correção do `BUG-T1.7-01` na rodada 1 da T1.7). Sem aprovação registrada do dono.
2. **Casos antes do código:** altera apenas `docs/decisoes/0020-regras-e1-parte-b.md` (acrescentando o item 22, depois expandido em `f31f181`), **antes** do commit de correção `e4e5920` (ancestral via merge `58f2fc4`).
3. **Conformidade com a spec:** coerente com o item 11 da ADR-0020 e necessário para eliminar a dependência de ordem descoberta pelo QA em `BUG-T1.7-01`.
4. **Dependências:** depende de `T1.5` e `docs/decisoes/0020-regras-e1-parte-b.md` (fora de `main`).
5. **Choques:** 0 conflitos com `main` e 0 com `docs/E1-T1.3-cartao`.
6. **Veredito:** **`APROVEITAR COM AJUSTES`** — Não entra como commit solto; consolidar no PR de **T1.5 + ADR-0020** para aprovação explícita do dono.

#### B. Commit `dffb454` — `docs(E1): gate E1 preparado pelo CTO e CHANGELOG v0.1 e v0.1.1`

1. **Cartão:** **não possui cartão** (tenta adiantar `T1.4g` e `T1.10` do `ROADMAP.md`, que exigem todas as tarefas mescladas, CI verde e assinatura do dono). Sem aprovação do dono.
2. **Casos antes do código:** não se aplica (governança/gate).
3. **Conformidade com a spec (`docs/spec/Meu_financeiro.md` seção 17 e `ROADMAP.md:125,137`):** **NÃO CONFORME.**
   - Marca checkboxes concluídos em `docs/gates/E1.md` (Partes A e B) citando um **"PR #19"** e *"CI verde no PR #19"* (`docs/gates/E1.md:62,65,66`) — PR inexistente/não mesclado em `main` (onde já entrou o PR #20).
   - Grava entradas `[0.1]` e `[0.1.1]` em `CHANGELOG.md:7-20` antes dos merges reais em `main`, das revisões por PR, das respostas do dono às perguntas de explicação do gate e da criação das tags.
4. **Dependências:** depende de **todas** as tarefas da E1 (T1.3, T1.5–T1.8) mescladas em `main` e da assinatura do dono.
5. **Choques:** 0 conflitos textuais com `main`, mas conflito de histórico/governança com `main` (referências falsas a PR #19 e hashes da `zen-mayer`).
6. **Veredito:** **`DESCARTAR`** — Motivo objetivo: viola o processo de gates da seção 17 da spec e do `ROADMAP.md` ao antecipar checklist e `CHANGELOG.md` com referências a um PR #19 inexistente/não mesclado em `main`. `docs/gates/E1.md` e `CHANGELOG.md` devem ser preenchidos somente após o merge real de cada parte em `main` (`T1.4g` para `v0.1`, `T1.10` para `v0.1.1`).

---

## 3. Plano de PRs em ordem de dependência

Cada PR abaixo contém **exatamente uma tarefa** e **no máximo uma regra financeira**. As trilhas **E2** (PRs 1–4) e **E1** (PRs 5–9) são independentes entre si e podem ser intercaladas conforme a prioridade do dono (por exemplo, abrir o PR 5 primeiro se o dono quiser fechar logo o gate E1 parte A `v0.1`). Dentro de cada trilha, a ordem de dependência é estrita.

| Ordem | PR / Tarefa | Depende de | Origem na `zen-mayer` (commits / arquivos) | Ajustes obrigatórios antes do merge | O que o revisor precisa olhar | Quem revisa (equipe Claude) |
|---|---|---|---|---|---|---|
| **1** | `T2.10` — README de instalação | `main` (`T2.1`) | `d08abef`, `30263e3`: `README.md`, `docs/tasks/E2/T2.10.md` | Nenhum no conteúdo se entrar antes de `T2.2`/`T2.5`; se entrar depois, atualizar pastas (`components/`, `drizzle/`) e scripts (`db:migrate`). Fechar `QA PASS` após `30263e3`. | Ausência de segredos/e-mail real; fidelidade a `.env.example`, `lib/env.ts` e `docker-compose.yml`; `pnpm format:check`. | `qa` + `cto` (`revisor` dispensado: só documentação, `ROADMAP.md:27`). |
| **2** | `T2.1s` — Bump `next` `^16.4.6` + emenda ADR-0019 | `main` (`T2.1`) | `1a18c51`: linha do `next` em `package.json`, `pnpm-lock.yaml` (só `next`/`@next/*`), `docs/tasks/E2/T2.1s.md` + emenda nova em `docs/decisoes/0019-base-do-app-e2.md` | Criar emenda na ADR-0019 aprovada pelo dono (`CLAUDE.md:12`); desacoplar de `T2.2`; decidir `^16.4.6` vs `~16.4.6`; rodar QA (3x `pnpm build` sem `SecurityFatalError`). | Integridade do lockfile (só `next`, `@next/env`, `@next/swc-*`), `react`/`react-dom` intactos, confirmação do aviso de segurança do Next (`[VERIFICAR]`), existência da emenda de ADR. | `qa` + `revisor` + `cto` (`revisor` obrigatório: dependência e segurança). |
| **3** | `T2.5` — Shell da interface e `/entrar` | `main` (`T2.1`), recomendado após PR 2 | `73e02ff`, `f5abd76`: `app/**`, `components/**`, `docs/tasks/E2/T2.5.md` (**excluir `next-env.d.ts`**) | **Reverter `next-env.d.ts`** (fora da área permitida); re-rodar QA após correção de foco e alvo ≥ 44 px (390 e 1280 px); (opcional) refinar `startsWith` em `navegacao-principal.tsx:21`. | Ausência de dados fictícios, auth prematura ou regra financeira na UI; foco visível sem corte; alvos ≥ 44 px; `next-env.d.ts` intocado; `pnpm build` verde. | `qa` + `cto` (`revisor` dispensado: UI estática sem dados/auth/regra financeira). |
| **4** | `T2.2` — Schema Drizzle, migrações, RLS + ADR-0021 | `main` (`T2.1`), recomendado após PR 2 | `a266bb7` (`0021-banco-e2.md`, linha no `README.md`), `c78d21d` (`.gitignore`), `4a2c417`, `48d7b1a`, `6a31ab7`, `8660028`, `2aeaa71`, `30e86df`, `c9a2bd8`: `drizzle.config.ts`, `drizzle/**`, `lib/database/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.gitignore`, `tests/lib/database/schema.test.ts`, `tests/integration/migration.test.ts`, `tests/qa/database-qa.test.ts`, `docs/tasks/E2/T2.2.md` | Aprovação do dono para ADR-0021, `pnpm-workspace.yaml` e `RISCO-T2.2-QA-02`; incluir `.gitignore` nos arquivos permitidos; resolver `transactions.posted_at` (`date` vs `timestamptz`); regenerar lockfile sobre `next@16.4.6`; (recomendado) consolidar migrações `0000`+`0002`+`0003`; rodar os **36 testes contra Postgres real** no QA. | `bigint` em todas as 6 colunas monetárias; RLS `ENABLE` + `FORCE` nas 11 tabelas sem `CREATE POLICY`; índice único `(account_id, identity_key)` + `NOT NULL`; `prepare: false`; `posted_at`; execução real em Postgres + `anon` lendo zero; nenhum vazamento de URL. | `qa` + `revisor` + `cto` (`revisor` obrigatório: banco, migrações, RLS, dependências). |
| **5** | `T1.3` — Identidade e dedup + ADR-0022 *(1 regra financeira)* | `main` (`T1.0`–`T1.2`) + decisão do dono sobre ADR-0022 | Cartão e `0022-identidade-detalhes-t1.3.md` de `docs/E1-T1.3-cartao` (`597b1e5`) + código/testes de `8148e59`, `6c9de9a`, `37c98cc`, `6af3420`, `b7bc0a2`: `domain/transactions/identity.ts`, `domain/transactions/index.ts`, `tests/domain/transactions/identity.test.ts`, `tests/qa/identity-qa.test.ts` | Usar cartão novo (evita conflito `add/add`); se ADR-0022 aprovada, completar `tests/domain/transactions/identity.test.ts` com todos os casos `C2.1`–`C2.14`; se rejeitada, restringir ao escopo estrito da seção C da T1.0. | Todos os casos C (e C2 se aprovados) sem enfraquecer; texto exato de `baseKeyInput`/`identityKey`; `\p{White_Space}`; `Number.isSafeInteger`; `complete` vs `incremental`; pureza de `domain/` (hash injetado). | `qa` + `revisor` + `cto` (`revisor` obrigatório: regra financeira). |
| — | *(Marco — Gate E1 parte A, `T1.4g`)* | PR 5 mesclado | Novo (descartar `dffb454`) | Dono lê diffs, explica perguntas do gate, fecha `docs/gates/E1.md` (Parte A), atualiza `CHANGELOG.md` e cria tag `v0.1`. | Checklist do gate E1 parte A. | `cto` + dono. |
| **6** | `T1.5` — Casos de teste da Parte B + ADR-0020 | `main` (`T1.2`) | `a4799f8`, `a266bb7` (`T1.5.md`, `0020-regras-e1-parte-b.md`, linha 0020 em `docs/decisoes/README.md`), `4a9e87e` (nota `refund`+`isTransfer`), `3744644`, `6b84bd5`, `5b06c57`, `f31f181` (itens 19–22) | Aprovação formal do dono em `main` para os casos D–G e todos os 22 itens da ADR-0020 (incluindo adiamento do pagamento a maior da fatura para E3 e desempate final do item 22). | Coerência entre casos D–G, ADR-0020, `docs/spec/Fase0_roteiro.md` (Tarefas 5–7) e `docs/spec/Meu_financeiro.md` (5.3, 5.5–5.7). | `cto` + dono (`qa` e `revisor` dispensados: sem código, `T1.5.md:7`). |
| **7** | `T1.6` — Datas civis e `spendingForPeriod` *(1 regra financeira)* | PR 5 (`ROADMAP`) e PR 6 (`T1.5`/ADR-0020) | `2422e93`, `8122c1a`, `ae2745e` + `default: never` de `a25325d` (`domain/reports/spending.ts` apenas): `domain/dates/**`, `domain/reports/**`, `tests/domain/dates/**`, `tests/domain/reports/**`, `tests/qa/dates-qa.test.ts`, `tests/qa/spending-qa.test.ts`, `docs/tasks/E1/T1.6.md` | Trazer `default: never` de `a25325d` para este PR; aplicar decisão do dono sobre `BUG-T1.6-01`; (recomendado) `Number.isSafeInteger` em `daysInMonth` e teste de período invertido no dev. | Somas só com `domain/money`; aritmética civil sem `Date`; fatura, caixinha e transferência casada fora de gastos/receitas; `pending` incluído; `refund` subtraindo; `unclassified` com sinal; `BUG-T1.6-01`. | `qa` + `revisor` + `cto` (`revisor` obrigatório: regra financeira). |
| **8** | `T1.7` — `detectTransfers` *(1 regra financeira)* | PR 5 (`T1.3`), PR 6 (`T1.5`/ADR-0020), PR 7 (`T1.6`) | `76bac37`, `01ae924`, `a11416e`, `e190999`, `e4e5920`: `domain/transfers/**`, `tests/domain/transfers/**`, `tests/qa/transfers-qa.test.ts`, `docs/tasks/E1/T1.7.md` (**excluir `a25325d`**) | Excluir `a25325d` (manutenção de `spending.ts` vai no PR 7 e de `transaction.ts` fica separada/opcional); (recomendado) `Number.isSafeInteger(windowDays)` em `detect.ts:56`. | Casos F completos; `negate` de `domain/money`; `daysBetween`; cada perna usada no máximo 1 vez; determinismo independente de ordem com `tx.type` no texto canônico (item 22); confiança `high`/`medium`. | `qa` + `revisor` + `cto` (`revisor` obrigatório: regra financeira). |
| **9** | `T1.8` — `categorize` *(1 regra financeira)* | PR 5 (`T1.3`) e PR 6 (`T1.5`/ADR-0020) *(paralelizável com PR 7/8)* | `7dc1302`, `9369800`, `614d706`: `domain/categories/**`, `tests/domain/categories/**`, `tests/qa/categorize-qa.test.ts`, `docs/tasks/E1/T1.8.md` | Nenhum ajuste de código; apenas garantir que PR 5 e PR 6 (com itens 19–21 da ADR-0020) já estejam em `main`. | Ordem de prioridade (`type` primeiro); `investment` blindado contra regra do usuário; palavra inteira com espaço; especificidade pelo padrão normalizado mais longo; empate pelo primeiro; `reason` e `pattern`. | `qa` + `revisor` + `cto` (`revisor` obrigatório: regra financeira). |
| *(Opcional)* | Refactor `daysInMonth` em `transaction.ts` | PR 7 (`T1.6`) | Trecho de `domain/transactions/transaction.ts` do commit `a25325d` | Só abrir se o dono aprovar acoplar `domain/transactions/` a `domain/dates/`. | Zero mudança de comportamento em `validateTransaction` (datas inválidas como `0000-02-29` continuam sem lançar). | `qa` + `revisor` + `cto` (`revisor` obrigatório: toca `domain/`). |
| — | *(Marco — Gate E1 parte B, `T1.10`)* | PRs 6–9 mesclados | Novo (descartar `dffb454`) | Dono fecha `docs/gates/E1.md` (Parte B), atualiza `CHANGELOG.md` e cria tag `v0.1.1`. | Checklist do gate E1 parte B. | `cto` + dono. |

---

## 4. Recomendação geral

**Aproveitar a linha `zen-mayer` de forma fatiada, nunca por merge direto.** O código de domínio (`T1.3`, `T1.6`–`T1.8`), o schema/RLS (`T2.2`), o shell visual (`T2.5`) e o `README` (`T2.10`) têm alta qualidade técnica, passam nos checks locais e não têm conflito com `main`, economizando semanas de reescrita. Porém, a branch atropelou o processo de governança (sem PRs nem aprovações do dono em `main`, bump do `next` sem ADR, 36 testes de Postgres não rodados aqui, `next-env.d.ts` indevido em `T2.5`, refactor misturado `a25325d` em `T1.7` e gate prematuro `dffb454`). Reaproveite via os **9 PRs isolados** do plano acima — descartando `dffb454` — com revisão real da equipe Claude e execução contra Postgres em `T2.2`.

---

## 5. Decisões do dono

- Decidir se aproveita a branch `origin/pendente/zen-mayer-E1-E2` fatiada nos 9 PRs recomendados ou se descarta a branch inteira e reimplementa a partir de `main`.
- Decidir se aprova a **ADR-0022** proposta em `docs/E1-T1.3-cartao` (espaço Unicode `\p{White_Space}`, inteiros seguros em `existingCounts`/`occurrence`, linhas excluídas contando em `existingCounts`, sem reenvio em `incremental` e SHA-256 completo).
- Decidir se aprova a emenda na **ADR-0019** para subir `next` de `^16.4.1` para `^16.4.6` (e se prefere `^16.4.6` ou `~16.4.6`).
- Decidir se aprova formalmente os casos da **T1.5** e a **ADR-0020** (itens 1 a 22), incluindo o adiamento da sinalização de pagamento a maior da fatura para o E3 (item 6) e o desempate final por índice em linhas quase idênticas (item 22).
- Decidir sobre **`BUG-T1.6-01`** em `spendingForPeriod`: aceitar o risco de dependência de ordem perto de `Number.MAX_SAFE_INTEGER` (~R$ 90 trilhões, mantendo `it.fails`) ou exigir acumulação interna em `bigint` via ADR.
- Decidir se aprova formalmente a **ADR-0021** (`drizzle-orm`, `postgres`, `drizzle-kit`) e o arquivo `pnpm-workspace.yaml` com `allowBuilds: { esbuild: false }`.
- Decidir sobre **`transactions.posted_at`** em `T2.2`: alterar a coluna para `date` (alinhando com `domain/transactions/transaction.ts`, que valida `YYYY-MM-DD`) ou manter `timestamptz` registrando justificativa em ADR.
- Decidir sobre **`RISCO-T2.2-QA-02`** em `T2.2`: aceitar FKs simples (delegando isolamento de `user_id` ao servidor/repositório, mantendo `it.fails` ou documentando) ou exigir FKs compostas com `user_id` no schema.
- Decidir se consolida as migrações `0000`+`0002`+`0003` em um único `0000_schema_inicial.sql` + `0001_rls.sql` antes do primeiro merge de `T2.2` em `main`.
- Decidir se quer unificar `daysInMonth` em `domain/transactions/transaction.ts` (PR opcional pós-T1.6, acoplando `domain/transactions/` a `domain/dates/`) ou manter `domain/transactions/` independente da Parte B.
- Decidir qual trilha priorizar primeiro na fila de revisão de PRs: começar pela trilha **E1 parte A** (PR 5 `T1.3` → gate `v0.1`) ou pela trilha **E2** (PR 1 `T2.10` → PR 2 `T2.1s` → PR 3 `T2.5` → PR 4 `T2.2`).
