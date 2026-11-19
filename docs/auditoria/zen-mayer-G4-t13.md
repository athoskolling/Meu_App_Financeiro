# G4: a T1.3 da zen-mayer contra o cartão novo (equipe Claude)

**Comparado:** `domain/transactions/identity.ts` da zen-mayer (`fb6bf2a`) contra o cartão novo `docs/tasks/E1/T1.3.md` e a ADR-0022 proposta (branch `docs/E1-T1.3-cartao`, `597b1e5`). Os casos aprovados da seção C vêm de `docs/tasks/E1/T1.0.md`.

## 1. Seção C (casos aprovados na T1.0)

`tests/domain/transactions/identity.test.ts` da zen-mayer tem um teste por linha das tabelas da seção C, com nomes que descrevem a regra:

- `normalizeText`: linhas 35 a 44;
- `baseKeyInput` e `baseKey`: 50 a 90;
- `identityKey`: 107;
- `assignIdentities`: 123 a 214.

O texto canônico é conferido **exatamente** (linhas 50 e 55, com o hash falso `h = (s) => \`h(${s})\``). Todos passam (`pnpm test`, G2 item 1). O QA da zen-mayer acrescentou `tests/qa/identity-qa.test.ts`.

| Grupo da seção C | Coberto? | Passa? |
|---|---|---|
| `normalizeText` (3 casos) | sim | sim |
| `baseKeyInput` e `baseKey` (11 casos, texto exato) | sim | sim |
| `assignIdentities` (17 casos, incluindo reimportação, sobreposição e incremental) | sim | sim |

## 2. Casos C2 (propostos na ADR-0022)

**Correção depois do parecer do revisor:** a primeira versão dizia que os C2 não existiam como teste na zen-mayer. Na verdade, `tests/qa/identity-qa.test.ts` já cobre a maior parte: NEL (`:33`, `:403`), U+202F e U+3000 (`:382-383`), NFC e NFD (`:360-377`), `-0` (`:505`), `Infinity` (`:536`), chave inválida fora do lote (`:545`), `mode` inválido (`:549`) e 13 contra 12 (`:568`). `2 ** 60` está em `identity.test.ts:212`. **Sem teste ficam C2.3 (U+200B), C2.11 (estouro sem resultado parcial) e C2.13 (mensagens sem dados)**: `grep -nE '200b|MAX_SAFE_INTEGER - 1|message' tests/qa/identity-qa.test.ts tests/domain/transactions/identity.test.ts` não devolve nada. Também rodei os 14 casos contra o código dela, com um teste temporário num worktree descartável; o arquivo foi apagado e não entrou em commit nenhum, e o `git status` ficou limpo. Resultado: **14 de 14 passaram.**

| Caso | Passa | Por quê, no código |
|---|---|---|
| C2.1 U+0085 | sim | `replace(/\p{White_Space}+/gu, ' ')` (`identity.ts:21`) |
| C2.2 tab, `\n`, `\r\n`, U+202F, U+3000 | sim | idem |
| C2.3 U+200B fica | sim | U+200B não é `White_Space` |
| C2.4 NFC = NFD | sim | `normalize('NFD')` e depois remove `\p{M}` |
| C2.5 `0` e `-0` | sim | `JSON.stringify(-0) === '0'` |
| C2.6 contas separadas | sim | `accountRef` está no texto canônico |
| C2.7 `Infinity`, `2**60`, `'2'`, `null` | sim | `Number.isSafeInteger(count)` em **todas** as entradas do mapa (linha 64) |
| C2.8 `{A: 0}` | sim | `count >= 0` |
| C2.9 chave inválida fora do lote | sim | o laço percorre `existingCounts.values()`, não as chaves do lote |
| C2.10 `identityKey` com ocorrência inválida | sim | linhas 42 a 44 |
| C2.11 passa do inteiro seguro | sim | a conferência na linha 76 lança dentro do `map`; não há resultado parcial |
| C2.12 `mode` inválido | sim | linhas 60 a 62 |
| C2.13 mensagens sem dados | sim | as mensagens são fixas; nenhuma interpola valor |
| C2.14 13 iguais contra `{A: 12}` | sim | `isNew: occurrence > existing` |

## 3. API

A API é **idêntica** ao contrato da T1.0 e aos nomes do item 4 da ADR-0022: `Hash`, `Mode`, `IdentifiedTransaction`, `normalizeText`, `baseKeyInput`, `baseKey`, `identityKey` e `assignIdentities`, com as mesmas assinaturas. O item de saída tem nome (`IdentifiedTransaction`), em vez de tipo anônimo, mas o formato é o mesmo.

## 4. Regras do `CLAUDE.md` sobre identidade

| Regra | Cumprida? | Onde |
|---|---|---|
| `baseKey` + ocorrência | sim | `identity.ts:37-46` |
| `existingCounts` | sim | `:54-86` |
| modos `complete` e `incremental` | sim | `:75` |
| hash injetado, sem `node:crypto` | sim | `type Hash`, G2 item 3 |
| id da Pluggy é só dica | sim | `externalId` fora do texto canônico (`:25`) |
| exclusão lógica | não se aplica aqui | o domínio não persiste; o contrato fica com a T2.6 e a T3.4 (ADR-0022, item 3) |

## 5. Os quatro pontos da ADR-0022

1. **U+0085:** já tratado (`\p{White_Space}`). Na zen-mayer, entrou como correção do QA (`6af3420` e `b7bc0a2`).
2. **Inteiros seguros:** já tratado nas três funções.
3. **Linhas excluídas contam em `existingCounts`:** isto é contrato de quem chama a função, não do domínio. A zen-mayer não registra esse ponto. **A ADR-0022 continua útil para isso.**
4. **Lote `incremental` repetido:** também é contrato de quem chama. A ADR-0022 continua útil.

## 6. Veredito

**CUMPRE.** A T1.3 da zen-mayer cumpre a seção C e os 14 casos C2. Recomendo **não reimplementar**: o dev-backend Claude refaria um código que já passa em tudo. O caminho mais barato é:

1. aprovar a ADR-0022. Os itens 1, 2 e 4 passam a registrar o que já está implementado; o item 3 é o contrato para a T2.6 e a T3.4;
2. acrescentar como teste **só os C2 que faltam (C2.3, C2.11 e C2.13)**, num commit pequeno, no PR B do G3;
3. marcar o cartão novo da T1.3 como "substituído" pelo da zen-mayer.
