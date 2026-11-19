# Auditoria G4 — T1.3 da `zen-mayer` contra o cartão novo e ADR-0022

- **Responsável:** `gemini-revisor` (somente leitura)
- **Alvo auditado:** worktree `gemini-zen-mayer` (commit `fb6bf2a`, ponta de `origin/pendente/zen-mayer-E1-E2`)
- **Referências comparadas:**
  - Cartão novo da T1.3: `docs/E1-T1.3-cartao:docs/tasks/E1/T1.3.md` (commit `597b1e5`)
  - ADR-0022 proposta: `docs/E1-T1.3-cartao:docs/decisoes/0022-identidade-detalhes-t1.3.md` (commit `597b1e5`)
  - Casos aprovados (seção C): `docs/tasks/E1/T1.0.md`
  - Regras do projeto: `CLAUDE.md`, `docs/decisoes/0018-nucleo-e1-parte-a.md`, `docs/spec/Meu_financeiro.md` (seção 5.4) e `docs/spec/Fase0_roteiro.md` (Tarefa 3)
- **Commits da T1.3 na `zen-mayer`:** `694310a` (cartões E1/E2), `8148e59` (testes iniciais C), `6c9de9a` (implementação), `37c98cc` (testes QA), `a76a82d` (relatório QA), `6af3420` (fix rodada 1: `\p{White_Space}` e overflow de ocorrência), `b7bc0a2` (fix rodada 2: `Number.isSafeInteger` em `existingCounts` e `identityKey`), `fb917d5` (parecer revisor/CTO).

---

## 1. Execução dos testes na `zen-mayer` e tabela caso a caso (`C…` e `C2…`)

### Execução dos testes (worktree `gemini-zen-mayer` @ `fb6bf2a`)

1. **Testes do dev + testes do QA da T1.3:**
   - **Comando:**
     ```powershell
     Set-Location "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini-zen-mayer"; npx.cmd pnpm@12.11.2 vitest run tests/domain/transactions tests/qa/identity-qa.test.ts
     ```
   - **Saída resumida:**
     - `tests/domain/transactions/identity.test.ts` — 45 passed
     - `tests/domain/transactions/validate.test.ts` — 70 passed
     - `tests/qa/identity-qa.test.ts` — 53 passed
     - **Totais:** `Test Files 3 passed (3)` · `Tests 168 passed (168)` · `0 failed` · `0 skipped` · **Exit code: `0`**.

2. **Somente `tests/domain/transactions` (comando citado no roteiro da G4):**
   - **Comando:**
     ```powershell
     Set-Location "C:\Users\athos\OneDrive\Documentos\Projetos\Meu_App_Financeiro_auditoria\gemini-zen-mayer"; npx.cmd pnpm@12.11.2 vitest run tests/domain/transactions
     ```
   - **Saída resumida:**
     - `tests/domain/transactions/identity.test.ts` — 45 passed
     - `tests/domain/transactions/validate.test.ts` — 70 passed
     - **Totais:** `Test Files 2 passed (2)` · `Tests 115 passed (115)` · `0 failed` · `0 skipped` · **Exit code: `0`**.

### Tabela caso a caso — Seção C da `docs/tasks/E1/T1.0.md`

> **Convenção das etiquetas:** `C.1`–`C.14` correspondem na ordem exata às 14 linhas da tabela *"Casos de `normalizeText` e `baseKey`"* (`T1.0.md:250-263`); `C.idKey` corresponde à definição exata de `identityKey` (`T1.0.md:244`); `C.15`–`C.31` correspondem na ordem exata às 17 linhas da tabela *"Casos de `assignIdentities`"* (`T1.0.md:271-287`).
> Nas colunas abaixo, `identity.test.ts` = `tests/domain/transactions/identity.test.ts` e `identity-qa.test.ts` = `tests/qa/identity-qa.test.ts`.

| caso | existe teste na zen-mayer? (arquivo:linha) | o teste confere o texto exato de baseKeyInput/identityKey? | passa? | observação |
|---|---|---|---|---|
| **C.1** (`T1.0.md:250`) `normalizeText('  PADARIA   São  João ')` → `'padaria sao joao'` | Sim — `identity.test.ts:35-37` | N/A (confere retorno exato de `normalizeText`) | Sim | Confere string exata `'padaria sao joao'`. |
| **C.2** (`T1.0.md:251`) `normalizeText('CAFÉ\u00A0Ação')` (com NBSP U+00A0) → `'cafe acao'` | Parcial (dividido) — `identity.test.ts:38-40` e `41-43`; `identity-qa.test.ts:381` | N/A (confere retorno exato de `normalizeText`) | Sim (nos 2 testes); **`[INFERIDO]`** Sim na entrada exata | `identity.test.ts:39` usa espaço comum `U+0020` (`'CAFÉ Ação'`) em vez de `U+00A0` (o `U+00A0` é testado à parte na L42 com `` `a${nbsp} ${nbsp}b\tc` ``). **`[INFERIDO]`** Na entrada exata `'CAFÉ\u00A0Ação'`, `identity.ts:16-23` executa `normalize('NFD')` → remove `\p{M}` (`'CAFE\u00A0Acao'`) → `toLowerCase()` (`'cafe\u00A0acao'`) → `.replace(/\p{White_Space}+/gu, ' ')` converte `U+00A0` em `' '` → `trim()` retorna `'cafe acao'`. |
| **C.3** (`T1.0.md:252`) `normalizeText('Padaria.')` vs `'Padaria'` → diferentes | Sim — `identity.test.ts:44-46`; `identity-qa.test.ts:415-418` | N/A (testa `normalizeText` com `.not.toBe`) | Sim | Pontuação preservada. |
| **C.4** (`T1.0.md:253`) `baseKeyInput(base)` texto exato | Sim — `identity.test.ts:50-54` | **Sim** | Sim | Compara com literal exato `'["manual","conta-1","2026-10-06",null,-830,"padaria exemplo"]'`. |
| **C.5** (`T1.0.md:254`) `baseKey(base, h)` texto exato | Sim — `identity.test.ts:55-57` | **Sim** (via `baseKey`) | Sim | Compara com literal exato `'h(["manual","conta-1","2026-10-06",null,-830,"padaria exemplo"])'`. |
| **C.6** (`T1.0.md:255`) `amount` `-830` vs `-831` → `baseKey` diferente | Sim — `identity.test.ts:58-60`; `identity-qa.test.ts:509-514` | Não (usa `.not.toBe`) | Sim | Confere diferença de 1 centavo em `baseKey`. |
| **C.7** (`T1.0.md:256`) caixa, acento ou espaços na descrição → mesma `baseKey` | Sim — `identity.test.ts:61-63` | Não (compara `bk(...)` com `bk(base)`) | Sim | Testa `'  PADÁRIA   exemplo '`. |
| **C.8** (`T1.0.md:257`) `time: '09:00'` vs sem `time` → `baseKey` diferente | Sim — `identity.test.ts:64-66` | Não (usa `.not.toBe`) | Sim | `time` ausente serializa como `null` (`identity.ts:31`), distinto de `'09:00'`. |
| **C.9** (`T1.0.md:258`) `source`, `accountRef` ou `date` diferente → `baseKey` diferente | Sim — `identity.test.ts:67-73` | Não (usa `.not.toBe`) | Sim | `it.each` testa os 3 campos separadamente. |
| **C.10** (`T1.0.md:259`) `externalId` diferente → mesma `baseKey` | Sim — `identity.test.ts:74-76`; `identity-qa.test.ts:617,622` | Não (compara duas chamadas de `bk`) | Sim | `externalId` fora de `baseKeyInput` (`identity.ts:26-35`). |
| **C.11** (`T1.0.md:260`) `status` `pending` vs `posted` → mesma `baseKey` | Sim — `identity.test.ts:77-79`; `identity-qa.test.ts:614,622` | Não (compara duas chamadas de `bk`) | Sim | Efetivação não altera `baseKey`. |
| **C.12** (`T1.0.md:261`) `type`, `postedAt` ou `merchantName` diferente → mesma `baseKey` | Sim — `identity.test.ts:80-86`; `identity-qa.test.ts:615-618,622` | Não (compara `bk` com `bk(base)`) | Sim | `it.each` testa os 3 campos separadamente. |
| **C.13** (`T1.0.md:262`) `{ ...base, itemId: 'item-novo' }` → mesma `baseKey` | Sim — `identity.test.ts:87-89` | Não (compara `bk` com `bk(base)`) | Sim | Reconexão (`itemId`) fora de `baseKeyInput`. |
| **C.14** (`T1.0.md:263`) descrição com aspas e barra (`'Loja "X" \\ Y'`) → JSON válido | Sim — `identity.test.ts:90-100`; `identity-qa.test.ts:422-443` | Parcial (valida `JSON.parse(baseKeyInput(t))` com `.toEqual`) | Sim | Confere o array recuperado exatamente como especificado em `T1.0.md:263`. |
| **C.idKey** (`T1.0.md:244`) `identityKey(bk, n, h)` = `h(JSON.stringify([bk, n]))` | Sim — `identity.test.ts:107-109`; `identity-qa.test.ts:581-584` | **Sim** | Sim | Confere literal exato `identityKey('k', 3, h) === 'h(["k",3])'`. |
| **C.15** (`T1.0.md:271`) Lote vazio `[]`, `{}` nos dois modos → `[]` | Sim — `identity.test.ts:123-126` | N/A (retorno `[]`) | Sim | Testa `complete` e `incremental`. |
| **C.16** (`T1.0.md:272`) Determinismo (`[A]` em 2 chamadas, `{}`, `complete`) | Sim — `identity.test.ts:127-129` | Não (compara `identityKey` entre duas chamadas) | Sim | Mesma `identityKey` nas duas execuções. |
| **C.17** (`T1.0.md:273`) Dois cafés iguais, banco vazio (`[A, A]`, `{}`, `complete`) → `1/novo`, `2/novo` | Sim — `identity.test.ts:130-137` | Não (compara `.not.toBe` entre as `identityKey`) | Sim | Confere `[1, true]`, `[2, true]` e `identityKey` distintas. |
| **C.18** (`T1.0.md:274`) Reimportação integral (`[A, A]`, `{A: 2}`, `complete`) → `1/não`, `2/não` | Sim — `identity.test.ts:138-143`; `identity-qa.test.ts:132-147` | Não (confere `occurrence` e `isNew`) | Sim | Nenhuma linha marcada como nova. |
| **C.19** (`T1.0.md:275`) Período sobreposto (`[A, A, A]`, `{A: 2}`, `complete`) → `1/não`, `2/não`, `3/novo` | Sim — `identity.test.ts:144-150`; `identity-qa.test.ts:149-172` | Não (confere `occurrence` e `isNew`) | Sim | Só a 3ª ocorrência é nova. |
| **C.20** (`T1.0.md:276`) Mistura (`[A, B, A]`, `{A: 1}`, `complete`) → `A1/não`, `B1/novo`, `A2/novo` | Sim — `identity.test.ts:151-159` | Não (confere `occurrence`, `isNew` e `r[1].baseKey === bk(B)`) | Sim | Contagem independente por `baseKey`. |
| **C.21** (`T1.0.md:277`) Id da fonte diferente (`[A']`, `{A: 1}`, `complete`) → `1/não`, mesma identidade | Sim — `identity.test.ts:160-164` | Parcial (compara `r[0].identityKey` com `identityKey(kA, 1, h)`) | Sim | Reconhece a linha gravada mesmo com outro `externalId`. |
| **C.22** (`T1.0.md:278`) Reapresentação (`[A]`, `{A: 1}`, `complete`) → `1/não` | Sim — `identity.test.ts:165-167` | Não (confere `occurrence` e `isNew`) | Sim | Não duplica linha reapresentada. |
| **C.23** (`T1.0.md:279`) Lote incremental (`[A]`, `{A: 2}`, `incremental`) → `3/novo` | Sim — `identity.test.ts:168-170` | Não (confere `occurrence` e `isNew`) | Sim | Continua contagem a partir de `existingCounts`. |
| **C.24** (`T1.0.md:280`) Incremental misto (`[A, B, A]`, `{A: 2}`, `incremental`) → `A3/novo`, `B1/novo`, `A4/novo` | Sim — `identity.test.ts:171-177` | Não (confere `occurrence` e `isNew`) | Sim | Contagem independente por `baseKey` em `incremental`. |
| **C.25** (`T1.0.md:281`) Incremental, banco vazio (`[A, A]`, `{}`, `incremental`) → `1/novo`, `2/novo` | Sim — `identity.test.ts:178-183` | Não (confere `occurrence` e `isNew`) | Sim | Começa em 1 quando banco está vazio. |
| **C.26** (`T1.0.md:282`) Chave ausente no mapa vale 0 (`[B]`, `{A: 5}`, `complete`) → `1/novo` | Sim — `identity.test.ts:184-186`; `identity-qa.test.ts:555-566` | Não (confere `occurrence` e `isNew`) | Sim | `existingCounts.get(bk) ?? 0` (`identity.ts:72`). |
| **C.27** (`T1.0.md:283`) `identityKey` igual entre modos (`A` com `occurrence` 3) | Sim — `identity.test.ts:187-192`; `identity-qa.test.ts:574-579` | Não (compara `i.identityKey` com `c.identityKey`) | Sim | Mesma `identityKey` em `complete` e `incremental`. |
| **C.28** (`T1.0.md:284`) Ordem e referência (`saida[i].tx === lote[i]`) | Sim — `identity.test.ts:193-198`; `identity-qa.test.ts:259-266` | N/A | Sim | Confere tamanho, ordem e referência exata (`toBe`). |
| **C.29** (`T1.0.md:285`) Sem mutação (lote/tx congelados; mapa com `set`/`delete`/`clear` lançando) | Sim — `identity.test.ts:199-207`; `identity-qa.test.ts:268-282` | N/A | Sim | Testado nos dois modos; QA confere também snapshot antes/depois. |
| **C.30** (`T1.0.md:286`) `existingCounts` inválido (`-1`, `1.5`, `NaN`) → lança `Error` | Sim — `identity.test.ts:208-210` (em `complete`) | N/A (espera `Error`) | Sim (em `complete`); **`[INFERIDO]`** Sim em `incremental` | Dev testa apenas em `complete`. **`[INFERIDO]`** Em `incremental`, `identity.ts:63-67` valida `existingCounts.values()` antes de usar `mode`, lançando `Error('assignIdentities: existingCounts deve conter inteiros >= 0')` para `-1`, `1.5` e `NaN`. |
| **C.31** (`T1.0.md:287`) `mode` inválido (`'x'` com cast) → lança `Error` | Sim — `identity.test.ts:214-216` | N/A (espera `Error`) | Sim | Lança `Error('assignIdentities: mode inválido')` (`identity.ts:60-62`). |

### Tabela caso a caso — Seção C2 do cartão novo (`docs/E1-T1.3-cartao:docs/tasks/E1/T1.3.md`)

> **Atenção:** o cartão novo exige que os casos `C2.1`–`C2.14` (se a ADR-0022 for aprovada) estejam em `tests/domain/transactions/identity.test.ts`. A coluna abaixo distingue o que existe no arquivo do dev, o que existe apenas no arquivo do QA (`tests/qa/identity-qa.test.ts`) e o que não existe em nenhum arquivo da `zen-mayer` (**`[INFERIDO]`**).

| caso | existe teste na zen-mayer? (arquivo:linha) | o teste confere o texto exato de baseKeyInput/identityKey? | passa? | observação |
|---|---|---|---|---|
| **C2.1** `normalizeText('a' + String.fromCharCode(0x85) + 'b')` → `'a b'` | **Só no QA** — `identity-qa.test.ts:411-413` (ausente em `identity.test.ts`) | N/A (confere retorno exato `'a b'` de `normalizeText`) | Sim (no QA) | Corrigido na rodada 1 (`6af3420`) com `\p{White_Space}+` em `identity.ts:21`. Falta no arquivo do dev. |
| **C2.2** `normalizeText` com `\t`, `\n`, `\r\n`, `U+202F`, `U+3000` entre duas palavras | **Só no QA** — `identity-qa.test.ts:380-390` (em `identity.test.ts:42` há apenas `\t`) | N/A (confere retorno exato `'pao de queijo'` de `normalizeText`) | Sim (no QA) | QA cobre todos os 5 caracteres em `it.each`; faltam `\n`, `\r\n`, `U+202F` e `U+3000` em `identity.test.ts`. |
| **C2.3** `normalizeText('a\u200Bb')` → `'a\u200Bb'` (U+200B preservado) | **Não** (nem em `identity.test.ts` nem em `identity-qa.test.ts`) | N/A (**`[INFERIDO]`**) | **`[INFERIDO]`** Passaria | **`[INFERIDO]`** Traço em `identity.ts:16-23`: `normalize('NFD')` mantém `U+200B`; `\p{M}` (L19) não casa (`U+200B` é categoria `Cf`, não `M`); `toLowerCase()` (L20) não altera; `\p{White_Space}+` (L21) não casa (`U+200B` não tem propriedade `White_Space`); `trim()` (L22) não remove `U+200B`. Retorno exato: `'a\u200Bb'`. (Citado apenas no parecer do revisor em `docs/tasks/E1/T1.3.md:124`.) |
| **C2.4** descrição em NFC (`'Café'`) vs NFD (`e` + `U+0301`) → mesma `baseKey` | **Só no QA** — `identity-qa.test.ts:371-378` (e fuzz L360-369; ausente em `identity.test.ts`) | Não (compara `baseKey(comNfc, h)` com `baseKey(comNfd, h)`) | Sim (no QA) | QA testa `'Café São João Ação'` NFC vs NFD em `baseKey`. Falta no arquivo do dev. |
| **C2.5** `amount` `0` e `-0` → mesma `baseKey` | **Só no QA** — `identity-qa.test.ts:505-507` (ausente em `identity.test.ts`) | Parcial (compara `baseKeyInput` de `-0` com `baseKeyInput` de `0`) | Sim (no QA); **`[INFERIDO]`** Sim para `baseKey` | QA compara `baseKeyInput`. **`[INFERIDO]`** Como `baseKey(t, h)` é `hash(baseKeyInput(t))` (`identity.ts:37-39`) e `JSON.stringify([-0]) === '[0]'` (L27-34), `baseKey` de `-0` e `0` são idênticas (`'h(["manual","conta-1","2026-10-06",null,0,"padaria exemplo"])'`). Falta no arquivo do dev. |
| **C2.6** lote `[A, A@conta-2]`, `{}`, `complete` → `1/novo`, `1/novo`; `baseKey` diferentes | **Parcial no QA** — `identity-qa.test.ts:601-609` (ausente em `identity.test.ts`) | Não | Sim (parcial no QA); **`[INFERIDO]`** Sim nas asserções faltantes | QA testa `[conta-1, conta-2, conta-1]` e verifica `occurrence: [1, 1, 2]`, mas não verifica `isNew` nem `r[0].baseKey !== r[1].baseKey` nesse teste. **`[INFERIDO]`** Em `identity.ts:29,71-85`, `accountRef` entra em `baseKeyInput`, gerando `baseKey` distintas (`conta-1` vs `conta-2`); para ambas, `existing = 0`, `inBatch = 1`, `occurrence = 1`, `isNew = (1 > 0) = true`. |
| **C2.7** `existingCounts` com `Infinity`, `2 ** 60`, `'2'`, `null`, **em cada modo** → lança `Error` | **Parcial (só `complete`)** — `identity.test.ts:211-213` (`2 ** 60` em `complete`); `identity-qa.test.ts:535-543` (`Infinity`, `'2'`, `null` em `complete`). **Nenhum em `incremental`.** | N/A (espera `Error`) | Sim em `complete`; **`[INFERIDO]`** Passaria em `incremental` | **`[INFERIDO]`** Em `identity.ts:63-67`, o loop `for (const count of existingCounts.values())` checa `!Number.isSafeInteger(count) \|\| count < 0` antes de qualquer ramo de `mode` (L75). Para `Infinity`, `2 ** 60`, `'2'` e `null`, `Number.isSafeInteger` retorna `false` (não faz coerção de string/`null`), lançando `Error('assignIdentities: existingCounts deve conter inteiros >= 0')` em ambos os modos. |
| **C2.8** `existingCounts` `{A: 0}` → aceito; `[A]` em `complete` dá `1/novo` | **Só no QA** — `identity-qa.test.ts:523-527` (ausente em `identity.test.ts`) | Não (compara saída de `{A: 0}` com mapa vazio via `toEqual`) | Sim (no QA) | `Number.isSafeInteger(0)` é `true` e `0 < 0` é `false` (`identity.ts:64`); resulta `occurrence: 1, isNew: true`. Falta no arquivo do dev. |
| **C2.9** `existingCounts` inválido em chave fora do lote (`{B: -1}`, lote `[A]`) → lança `Error` | **Só no QA** — `identity-qa.test.ts:545-547` (ausente em `identity.test.ts`) | N/A (espera `Error`) | Sim (no QA) | `identity.ts:63-67` percorre todas as entradas de `existingCounts.values()`. Falta no arquivo do dev. |
| **C2.10** `identityKey(bk, n, h)` com `0`, `-1`, `1.5`, `NaN`, `Infinity` e **`2 ** 53`** → lança `Error` | **Parcial no dev** — `identity.test.ts:104-106` (testa `NaN`, `Infinity`, `0`, `-1`, `1.5`; **falta `2 ** 53`** em dev e QA) | N/A (espera `Error`) | Sim para 5 valores; **`[INFERIDO]`** Passaria para `2 ** 53` | **`[INFERIDO]`** Em `identity.ts:42-44`, `Number.isSafeInteger(2 ** 53)` é `false` (`MAX_SAFE_INTEGER` é `2 ** 53 - 1`), portanto `identityKey(bk, 2 ** 53, h)` lança `Error('identityKey: occurrence deve ser inteiro seguro >= 1')`. |
| **C2.11** lote `[A, A]`, `{A: MAX_SAFE_INTEGER - 1}`, `incremental` → lança `Error` | **Só no QA (com 3 itens)** — `identity-qa.test.ts:639-644` usa `[BASE, BASE, BASE]` (e L646-650 testa `[BASE]` → `MAX`); ausente em `identity.test.ts` | N/A (espera `Error`) | Sim no QA (`[A, A, A]`); **`[INFERIDO]`** Passaria para `[A, A]` | **`[INFERIDO]`** Em `identity.ts:70-78`, para `[A, A]` com `existing = MAX_SAFE_INTEGER - 1`: item 1 calcula `occurrence = MAX_SAFE_INTEGER` (seguro); item 2 calcula `occurrence = (MAX_SAFE_INTEGER - 1) + 2 = 2 ** 53`; na L76 `!Number.isSafeInteger(2 ** 53)` é `true` e L77 lança `Error('assignIdentities: ocorrência fora do intervalo de inteiros seguros')` antes de retornar qualquer resultado. |
| **C2.12** `mode` `undefined`, `''` e `'COMPLETE'` (com cast) → lança `Error` | **Parcial no QA** — `identity-qa.test.ts:549-553` testa `undefined`, `''`, `'Complete'`, `'INCREMENTAL'` (**falta `'COMPLETE'`**; ausente em `identity.test.ts`) | N/A (espera `Error`) | Sim no QA (`undefined`, `''`); **`[INFERIDO]`** Passaria para `'COMPLETE'` | **`[INFERIDO]`** Em `identity.ts:60-62`, `mode !== 'complete' && mode !== 'incremental'` é comparação estrita sensível a caixa; `'COMPLETE'` entra no `if` e lança `Error('assignIdentities: mode inválido')`. |
| **C2.13** mensagens de todos os erros acima não contêm `'padaria'`, `baseKey` nem `1152921504606846976` | **Não** (nem em `identity.test.ts` nem em `identity-qa.test.ts`) | N/A (**`[INFERIDO]`**) | **`[INFERIDO]`** Passaria | **`[INFERIDO]`** Todos os 4 `throw new Error(...)` de `identity.ts` usam strings literais fixas sem interpolação: L43 (`'identityKey: occurrence deve ser inteiro seguro >= 1'`), L61 (`'assignIdentities: mode inválido'`), L65 (`'assignIdentities: existingCounts deve conter inteiros >= 0'`), L77 (`'assignIdentities: ocorrência fora do intervalo de inteiros seguros'`). Nenhuma contém `'padaria'`, a `baseKey` ou `'1152921504606846976'`. |
| **C2.14** 13 linhas iguais contra `{A: 12}`, `complete` → só a 13ª é nova (`occurrence` 13) | **Só no QA** — `identity-qa.test.ts:568-572` (ausente em `identity.test.ts`) | Não (confere `isNew` e `occurrence`) | Sim (no QA) | Falta no arquivo do dev. |

---

## 2. Diferenças de API

Comparação sistemática entre a `zen-mayer` (`domain/transactions/identity.ts` e `domain/transactions/index.ts`) e o contrato exigido pelo cartão novo (`docs/E1-T1.3-cartao:docs/tasks/E1/T1.3.md` + `docs/tasks/E1/T1.0.md` seção C + ADR-0022 item 4):

| Item | Contrato novo (T1.0 + cartão novo + ADR-0022) | `zen-mayer` (`identity.ts` / `index.ts`) | Diferença? |
|---|---|---|---|
| Tipo `Hash` | `export type Hash = (input: string) => string` | `identity.ts:4`: `export type Hash = (input: string) => string;` · `index.ts:7`: `type Hash` | **Nenhuma** |
| Tipo `Mode` | `export type Mode = 'complete' \| 'incremental'` | `identity.ts:5`: `export type Mode = 'complete' \| 'incremental';` · `index.ts:9`: `type Mode` | **Nenhuma** |
| Tipo `IdentifiedTransaction` | `{ tx: NormalizedTransaction; baseKey: string; occurrence: number; identityKey: string; isNew: boolean }` (ADR-0022 item 4) | `identity.ts:7-13`: `export interface IdentifiedTransaction { tx: NormalizedTransaction; baseKey: string; occurrence: number; identityKey: string; isNew: boolean; }` · `index.ts:8`: `type IdentifiedTransaction` | **Nenhuma** (campos, tipos e mutabilidade idênticos aos de `T1.0.md:237`) |
| `normalizeText` | `(s: string) => string` (NFD → remove `\p{M}` → minúsculas → `\p{White_Space}` → espaço comum colapsado → `trim`; pontuação fica) | `identity.ts:16-23`: `export function normalizeText(s: string): string` (`.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\p{White_Space}+/gu, ' ').trim()`) · `index.ts:6` | **Nenhuma** |
| `baseKeyInput` | `(t: NormalizedTransaction) => string` = `JSON.stringify([t.source, t.accountRef, t.date, t.time ?? null, t.amount, normalizeText(t.description)])` | `identity.ts:26-35`: exatamente os mesmos 6 campos na mesma ordem, `t.time ?? null`, `normalizeText(t.description)` · `index.ts:4` | **Nenhuma** (`merchantName`, `externalId`, `status`, `type`, `postedAt` e extras fora; `time: ''` distinto de `time: undefined`, como no contrato) |
| `baseKey` | `(t: NormalizedTransaction, hash: Hash) => string` = `hash(baseKeyInput(t))` | `identity.ts:37-39`: `export function baseKey(t: NormalizedTransaction, hash: Hash): string { return hash(baseKeyInput(t)); }` · `index.ts:3` | **Nenhuma** |
| `identityKey` | `(baseKey: string, occurrence: number, hash: Hash) => string` = `hash(JSON.stringify([bk, n]))`; lança `Error` se `occurrence` não for inteiro seguro `>= 1` | `identity.ts:41-46`: `export function identityKey(bk: string, occurrence: number, hash: Hash): string` · `index.ts:5` | **Cosmética apenas:** 1º parâmetro chama-se `bk` em vez de `baseKey` (evita sombrear a função `baseKey` no mesmo módulo; sem efeito de tipo/runtime). |
| `assignIdentities` | `(batch: readonly NormalizedTransaction[], existingCounts: ReadonlyMap<string, number>, mode: Mode, hash: Hash) => IdentifiedTransaction[]` | `identity.ts:54-59`: assinatura idêntica (`batch: readonly NormalizedTransaction[]`, `existingCounts: ReadonlyMap<string, number>`, `mode: Mode`, `hash: Hash`, retorno `IdentifiedTransaction[]`) · `index.ts:2` | **Nenhuma** |
| Reexportações em `domain/transactions/index.ts` | Apenas as 5 funções e os 3 tipos (`Hash`, `Mode`, `IdentifiedTransaction`) | `index.ts:1-10`: reexporta exatamente as 5 funções e os 3 tipos, sem símbolos extras. | **Nenhuma** |

**Resumo da seção 2:** não há nenhuma diferença funcional ou incompatibilidade de API entre a implementação da `zen-mayer` e o contrato do cartão novo + ADR-0022.

---

## 3. Regras do `CLAUDE.md` para identidade

Conferência ponto a ponto contra `CLAUDE.md` (linhas 20–21):

| Regra | Cumprida? | Prova (`arquivo:linha`) |
|---|---|---|
| 1. `baseKey` + ocorrência | **Sim** | `domain/transactions/identity.ts:26-39` gera `baseKey` sobre os 6 campos canônicos em JSON; `identity.ts:41-46` gera `identityKey = hash(JSON.stringify([bk, occurrence]))`; `identity.ts:69-85` calcula a ocorrência por `baseKey` usando o contador local `seen` e `existingCounts`. |
| 2. `existingCounts` | **Sim** | `domain/transactions/identity.ts:56` recebe `existingCounts: ReadonlyMap<string, number>`; `identity.ts:63-67` valida todas as entradas (`Number.isSafeInteger(count) && count >= 0`); `identity.ts:72` trata chave ausente como `0` (`existingCounts.get(bk) ?? 0`) sem mutar o mapa. |
| 3. Modos `complete` e `incremental` | **Sim** | `domain/transactions/identity.ts:5` tipa `Mode = 'complete' \| 'incremental'`; `identity.ts:60-62` rejeita qualquer outro valor em runtime; `identity.ts:75` faz `occurrence = mode === 'complete' ? inBatch : existing + inBatch`; `identity.ts:84` define `isNew: occurrence > existing` (em `complete`, só o excedente é novo; em `incremental`, como `inBatch >= 1`, todas são novas). |
| 4. Hash injetado (sem `node:crypto` em `domain/`) | **Sim** | `domain/transactions/identity.ts:1` importa apenas `type { NormalizedTransaction } from './transaction'`; `identity.ts:4,37,41,58` injetam `hash: Hash`. Nenhum import de `node:*`, `fs`, `fetch`, `crypto`, Drizzle ou Next; sem `Date`, `Math.random`, `console`, `this.constructor` ou `eslint-disable`. A expressão `node:crypto` só aparece em comentário (`identity.ts:3`), permitido pelo cartão novo. |
| 5. Id da Pluggy (`externalId`) só como dica (fora da identidade) | **Sim** | `domain/transactions/identity.ts:25-35` inclui apenas `source`, `accountRef`, `date`, `time ?? null`, `amount` e `normalizeText(description)`. `externalId` (bem como `merchantName`, `status`, `type`, `postedAt` e propriedades extras como `itemId`) fica fora de `baseKey` e `identityKey`. Coberto em `tests/domain/transactions/identity.test.ts:74-89,160-164`. |
| 6. Exclusão lógica (via `existingCounts`) | **Sim (no domínio)** | `domain/transactions/identity.ts:56,72,75,84` é pura e não conhece `deleted_at`: ao receber em `existingCounts` a contagem total (incluindo linhas excluídas logicamente), a reimportação em `complete` produz `occurrence <= existing` → `isNew: false`, evitando recriação. O contrato para a persistência foi anotado em `docs/tasks/E1/T1.3.md:127,135` (sem ADR própria na `zen-mayer`, diferentemente da ADR-0022). |

---

## 4. Os quatro pontos da ADR-0022

Análise contra `docs/E1-T1.3-cartao:docs/decisoes/0022-identidade-detalhes-t1.3.md`:

1. **`U+0085` (NEL na normalização de espaços):**
   - **Código:** **Atendido.** Após a rodada 1 (`6af3420`, correção do BUG-T1.3-01), `domain/transactions/identity.ts:21` usa `.replace(/\p{White_Space}+/gu, ' ')`, convertendo `U+0085` (e todos os demais caracteres `White_Space`: `U+00A0`, `U+202F`, `U+3000`, `\t`, `\n`, `\r\n`) em espaço comum e preservando `U+200B`/`U+FEFF`.
   - **Testes:** `U+0085` e a varredura de `White_Space` existem apenas em `tests/qa/identity-qa.test.ts:380-413`, **não** em `tests/domain/transactions/identity.test.ts`. `U+200B` (`C2.3`) não tem teste em nenhum arquivo da `zen-mayer`.

2. **Inteiros seguros (`existingCounts`, `identityKey`, overflow de `occurrence`, mensagens fixas):**
   - **Código:** **Atendido integralmente** (após `6af3420` e `b7bc0a2`):
     - `existingCounts`: `domain/transactions/identity.ts:63-67` valida todas as entradas do mapa com `!Number.isSafeInteger(count) || count < 0`, rejeitando negativos, não-inteiros, `NaN`, `Infinity`, `-Infinity`, `2 ** 60`, strings e `null`, inclusive em chaves fora do lote e nos dois modos.
     - `identityKey`: `domain/transactions/identity.ts:42-44` valida `!Number.isSafeInteger(occurrence) || occurrence < 1`, rejeitando `0`, `-1`, `1.5`, `NaN`, `Infinity` e `2 ** 53`.
     - Overflow de `occurrence`: `domain/transactions/identity.ts:76-78` valida `!Number.isSafeInteger(occurrence)` dentro de `batch.map`, lançando antes de devolver qualquer resultado parcial.
     - Mensagens fixas sem vazar dados: `identity.ts:43,61,65,77` são literais estáticos sem `baseKey`, descrição, valor ou contagem.
   - **Testes:** **Parciais/dispersos.** Faltam em `tests/domain/transactions/identity.test.ts` os casos `C2.7` em `incremental` (e `Infinity`/`'2'`/`null` nos dois modos), `C2.8`, `C2.9`, `C2.10` (`2 ** 53`), `C2.11` e `C2.13` (este último ausente também no QA).

3. **Linhas excluídas contam em `existingCounts`:**
   - **Código:** **Compatível** — pela própria ADR-0022 (item 3) e pelo cartão novo, não há código de `deleted_at` na T1.3; `domain/transactions/identity.ts:56,72,84` depende apenas da contagem recebida.
   - **Documentação:** na `zen-mayer`, a regra de que a camada chamadora (T2.6/T3.4) deve contar linhas excluídas foi registrada apenas nas observações do revisor e do CTO em `docs/tasks/E1/T1.3.md:127,135` — não há ADR formalizando o contrato nem menção no JSDoc de `identity.ts`.

4. **Lote `incremental` repetido:**
   - **Código:** **Compatível** — em `domain/transactions/identity.ts:75,84`, `incremental` sempre soma `existing + inBatch` e marca `isNew: true`; não é idempotente por desenho.
   - **Testes e documentação:** comportamento explicitamente verificado em `tests/qa/identity-qa.test.ts:586-591` e registrado no cartão da `zen-mayer` (`docs/tasks/E1/T1.3.md:116,127,135`, apontando `file_hash`/`image_hashes` na sincronização), mas sem ADR formal na `zen-mayer` (papel cumprido pela ADR-0022).

---

## 5. Veredito

### Veredito: **`CUMPRE COM AJUSTES`**

O **código de produção** (`domain/transactions/identity.ts`, 87 linhas, e `domain/transactions/index.ts`, 10 linhas) **cumpre 100%** do cartão novo, das regras do `CLAUDE.md`, da seção C da T1.0 e dos quatro pontos da ADR-0022, sem nenhuma divergência de API nem ajuste necessário no código de domínio.

O veredito não é `CUMPRE` puro porque **a suíte de testes do dev (`tests/domain/transactions/identity.test.ts`) e a higiene da branch histórica** não cumprem integralmente os critérios de aceite do cartão novo (assumindo ADR-0022 aprovada).

### Lista exata e priorizada de ajustes necessários

1. **[Alto — cobertura do cartão novo / ADR-0022] Completar `tests/domain/transactions/identity.test.ts` com todos os casos `C2.1`–`C2.14` (caso a ADR-0022 seja aprovada):**
   - Adicionar os **4 casos/subcasos ausentes em toda a `zen-mayer`** (nem dev nem QA):
     - `C2.3`: `normalizeText('a' + String.fromCharCode(0x200b) + 'b') === 'a' + String.fromCharCode(0x200b) + 'b'`;
     - `C2.7` em modo `incremental` (e em `complete` no arquivo do dev para `Infinity`, `'2'`, `null`, além de `2 ** 60`);
     - `C2.10`: incluir `2 ** 53` em `tests/domain/transactions/identity.test.ts:104-106`;
     - `C2.13`: conferir que `.message` de todos os erros lançados não contém `'padaria'`, a `baseKey` nem `'1152921504606846976'`.
   - Trazer para `tests/domain/transactions/identity.test.ts` os demais casos que hoje só existem em `tests/qa/identity-qa.test.ts`: `C2.1` (`U+0085`), `C2.2` (`\n`, `\r\n`, `U+202F`, `U+3000`), `C2.4` (NFC vs NFD), `C2.5` (`0` vs `-0`), `C2.6` (`[A, A@conta-2]` conferindo `1/novo`, `1/novo` e `baseKey` diferentes), `C2.8` (`{A: 0}`), `C2.9` (chave inválida fora do lote), `C2.11` (`[A, A]` com `MAX_SAFE_INTEGER - 1` em `incremental`), `C2.12` (`undefined`, `''`, `'COMPLETE'`) e `C2.14` (13 contra 12).
   - *(Observação condicional: se o dono **não** aprovar a ADR-0022, o critério 3 do cartão novo pede "nenhum C2 no arquivo"; nesse caso, remover de `tests/domain/transactions/identity.test.ts:104-106` e `211-213` os testes de C2 adicionados na rodada 2 da `zen-mayer`.)*
2. **[Médio — fidelidade à seção C da T1.0] Corrigir `tests/domain/transactions/identity.test.ts:39`:**
   - Trocar `normalizeText('CAFÉ Ação')` (espaço comum `U+0020`) por ``normalizeText(`CAFÉ${nbsp}Ação`)`` para corresponder ao pé da letra à entrada de `docs/tasks/E1/T1.0.md:251`, mantendo o escape de caractere invisível exigido pelo cartão novo.
3. **[Médio — processo e higiene do PR] Não reaproveitar a árvore de commits bruta da `zen-mayer`:**
   - Na `zen-mayer`, o histórico da T1.3 mistura 2 cartões E2 no commit `694310a` (`docs/tasks/E2/T2.5.md`, `T2.10.md`) e altera `tests/qa/identity-qa.test.ts` na rodada 1 do dev (`6af3420`). Um PR limpo a partir de `origin/main` deve tocar exclusivamente os 4 arquivos permitidos (`domain/transactions/identity.ts`, `domain/transactions/index.ts`, `tests/domain/transactions/identity.test.ts`, `docs/tasks/E1/T1.3.md`), com commit dos testes antes da implementação.

### Faz sentido o `dev-backend` Claude partir dessa implementação ou implementar do zero?

**Depende da decisão do dono na dúvida 3 do cartão novo, mas o custo de fazer do zero é muito baixo e evita atrito de processo:**

- **Por que aproveitar o código faz sentido (se o dono optar por reaproveitar a T1.3 da `zen-mayer`):** `domain/transactions/identity.ts` tem apenas **87 linhas**, **zero desvios de API**, zero desvios de regra financeira e já incorpora as correções das 2 rodadas de QA/revisão (inclusive `\p{White_Space}`, `Number.isSafeInteger` em `existingCounts`/`identityKey` e checagem de overflow de `occurrence`). Além disso, `tests/qa/identity-qa.test.ts` (53 testes com propriedades de 300/2000 seeds) é um bom material complementar para a etapa de QA. Para aproveitar com segurança, basta montar uma branch limpa a partir de `origin/main` (sem cherry-pick dos commits sujos `694310a`/`6af3420`), aplicar os ajustes 1 e 2 em `tests/domain/transactions/identity.test.ts` e rodar a cadeia QA → revisor → CTO → dono.
- **Por que implementar do zero também faz sentido (se o dono mantiver o cartão novo como tarefa normal do `dev-backend` Claude):** o código de produção são apenas **87 linhas simples e totalmente especificadas** pelo contrato da T1.0 + ADR-0022, e **quase todo o trabalho pendente está nos testes** (`tests/domain/transactions/identity.test.ts`, onde falta praticamente toda a seção C2). Implementar do zero a partir de `origin/main` garante naturalmente o critério *"testes primeiro"* (commit vermelho antes da implementação) e um histórico limpo, sem risco de violar a regra de autoria/isolamento entre branches.

**Recomendação prática:** se o dono quiser aproveitar o trabalho da `zen-mayer`, **vale aproveitar `domain/transactions/identity.ts` e `domain/transactions/index.ts` intactos** (com revisão normal e complemento dos casos C2 em `identity.test.ts` numa branch limpa de `main`), **nunca** fazendo cherry-pick direto dos commits misturados da `zen-mayer`. Caso contrário, para o `dev-backend` Claude implementar a T1.3 do zero seguindo o cartão novo, o esforço adicional sobre `identity.ts` é mínimo (~87 linhas) e mantém o fluxo TDD 100% íntegro.

---

## Verifiquei / Não consegui verificar

- **Verifiquei:**
  - Leitura completa de `docs/historico/delegacao/2026-11-19-gemini.md`, `docs/tasks/E1/T1.0.md`, `CLAUDE.md`, `docs/decisoes/0018-nucleo-e1-parte-a.md`, `docs/spec/Meu_financeiro.md` (seção 5.4) e `docs/spec/Fase0_roteiro.md` (Tarefa 3).
  - Leitura completa via `git show` de `docs/E1-T1.3-cartao:docs/tasks/E1/T1.3.md` e `docs/E1-T1.3-cartao:docs/decisoes/0022-identidade-detalhes-t1.3.md` (`597b1e5`).
  - Leitura completa na `zen-mayer` (`fb6bf2a`) de `domain/transactions/identity.ts`, `domain/transactions/index.ts`, `domain/transactions/transaction.ts`, `tests/domain/transactions/identity.test.ts`, `tests/qa/identity-qa.test.ts` e `docs/tasks/E1/T1.3.md`.
  - Inspeção de codepoints Unicode em `T1.0.md:251`, `identity.test.ts:39,42` e `docs/E1-T1.3-cartao:docs/tasks/E1/T1.3.md` (`C2.3`).
  - Verificação de pureza (`crypto`, `node:`, `Date`, `Math.random`, `console`, `eslint-disable`, `constructor`) e ausência de `.skip`/`.only`/`.todo`/`.fails` em `identity.ts` e `identity.test.ts`.
  - Histórico dos commits da T1.3 (`git log` e `git show --stat`) e diff de `index.ts` e `transaction.ts` contra `main`.
  - Execução no worktree `gemini-zen-mayer` de `vitest run tests/domain/transactions tests/qa/identity-qa.test.ts` (168/168 passaram, exit 0) e `vitest run tests/domain/transactions` (115/115 passaram, exit 0).
- **Não consegui verificar:**
  - Execução real dos casos marcados como **`[INFERIDO]`** (proibido escrever testes novos nesta tarefa somente leitura; todos foram validados por rastreamento linha a linha do código-fonte).
  - `pnpm typecheck`, `pnpm lint` e `pnpm format:check` globais na `zen-mayer` (escopo da G2; na G4 foram executados apenas os testes de identidade conforme o roteiro).
