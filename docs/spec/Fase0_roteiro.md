# Estágios E0 e E1 — Fundação e núcleo de domínio (roteiro)

Objetivo: preparar o repositório (E0) e construir e **testar** as regras difíceis do Meu Financeiro em TypeScript puro (E1), sem UI, sem banco e sem rede. Tudo roda com `pnpm test` em segundos.

Como vamos trabalhar: **os agentes escrevem o código; o dono não** (ADR-0015). O CTO transforma cada tarefa em casos de teste e em um cartão; o `dev-backend` implementa até os testes passarem; `qa`, `revisor` e CTO conferem; o dono lê o diff, pede alterações e aprova. Não há código pronto neste roteiro, só contratos, critérios e casos de teste. As seções abaixo que falam em "você" descrevem o que o **dev** deve entregar; o dono usa o roteiro para saber o que aprovar.

Regra de ouro: uma tarefa só termina quando os casos de teste dela passam **e** o dono consegue explicar por que cada regra existe (o `tutor` ajuda a estudar).

Este roteiro cobre os estágios **E0** (Tarefa 0) e **E1** (Tarefas 1 a 7). O gate de cada um está em `docs/gates/E0.md` e `docs/gates/E1.md`. O parser de linhas do Caju **e o mesclador de prints (Tarefa 4 abaixo)** saem deste estágio e vão para o E5. O E1 fecha em duas partes: **A** (Tarefas 1 a 3, tag `v0.1`) e **B** (Tarefas 5 a 7, tag `v0.1.1`, antes do E4).

---

# Estágio E0 — Fundação

## Tarefa 0 — Repositório, CI e regras

- Repositório novo, `pnpm`, TypeScript com `strict: true` (e `noUncheckedIndexedAccess`), Vitest, ESLint, Prettier.
- Pastas: `domain/money`, `domain/transactions`, `domain/transfers`, `domain/credit-card`, `domain/categories`, `domain/caju`, `tests/fixtures`, `docs/decisoes`, `docs/gates`.
- `.gitignore` e `.env.example` conforme a seção 4.1 da spec (inclui `*.png`, `*.jpg`, `*.heic`, `*.webp`). Nada de dados reais no Git.
- Scripts: `test`, `typecheck`, `lint`.
- **Regra de lint:** nada em `domain/` importa de fora de `domain/` (sem `fs`, `fetch`, Drizzle, Next, `node:*`). A regra tem que **falhar** num arquivo de exemplo que a viole; teste isso uma vez.
- **CI (GitHub Actions)** em push e PR: `tsc --noEmit`, ESLint, Vitest e gitleaks. `main` protegida; o trabalho vai por PR, mesmo sozinho.
- `CLAUDE.md` na raiz (modelo entregue junto) e `docs/decisoes/` com o índice de decisões.

**Pronto quando:** `pnpm typecheck && pnpm lint && pnpm test` passam num teste de exemplo, o CI fica verde num PR vazio e a regra de lint barra uma importação proibida.

---

# Estágio E1 — Núcleo de domínio

## Tarefa 1 — Money

Decisões a registrar em `docs/decisoes/`:
- Dinheiro em **centavos inteiros** no código, com tipo "brand" (`number` seguro ou `bigint`; escolha e justifique). No banco será `bigint` em centavos.
- Sem `float` em nenhum cálculo.

Contrato (assinaturas indicativas):

```ts
type Cents = number & { readonly __brand: "Cents" };
parseBRL(input: string): Cents          // lança erro com mensagem útil se inválido
formatBRL(value: Cents): string         // "R$ 1.234,56" / "-R$ 12,30"
fromDb(value: string | number | bigint): Cents   // borda com o driver do banco
add(a: Cents, b: Cents): Cents
sum(values: readonly Cents[]): Cents
negate(value: Cents): Cents
```

Casos de teste:

| Entrada | Esperado |
|---|---|
| `"1.234,56"` | 123456 |
| `"R$ 12,30"` | 1230 |
| `"-R$ 12,30"` e `"- R$ 12,30"` | -1230 |
| `"(12,30)"` | -1230 |
| `"12"` | 1200 |
| `"12,3"` | 1230 |
| `"0,01"` | 1 |
| `"1,234.56"` (formato americano) | erro (ambíguo, rejeitar) |
| `""`, `"abc"`, `"12,345"` | erro |
| `sum` de 10 e 20 centavos | 30 (existe para provar que não há float) |
| `formatBRL(0)` | `"R$ 0,00"` |
| ida e volta `parseBRL(formatBRL(x)) === x` para vários x, incluindo negativos | verdadeiro |
| `fromDb("123456")`, `fromDb(123456n)`, `fromDb(123456)` | 123456 nos três |
| `fromDb("9007199254740993")` (fora da faixa segura) | erro |

Cuidados: o separador de milhar e o espaço em `formatBRL` via `Intl` podem usar caracteres especiais (espaço não separável). Decida se normaliza e **teste isso**.

**Pronto quando:** todos os casos passam e `Number.isSafeInteger` é validado na criação (rejeite valores fora da faixa segura).

---

## Tarefa 2 — NormalizedTransaction e validação de sinal

Contrato (campos mínimos):

```ts
type TransactionType =
  | "income" | "expense" | "transfer"
  | "credit_card_purchase" | "credit_card_payment"
  | "refund" | "investment" | "other";

interface NormalizedTransaction {
  source: "open_finance" | "caju_ocr" | "manual";
  accountRef: string;               // identificador estável da conta (string opaca)
  externalId?: string;              // só uma dica; nunca a identidade sozinha
  date: string;                     // "YYYY-MM-DD" (data civil, sem fuso)
  time?: string;                    // "HH:mm" quando existir
  postedAt?: string;
  description: string;
  merchantName?: string;
  amount: Cents;                    // COM sinal: entrada +, saída -
  currency: "BRL";
  type: TransactionType;
  status: "pending" | "posted";
}

validateTransaction(t): ValidationResult   // lista de problemas, não lança por regra de negócio
```

Regras (seção 5.2 da spec):

- `expense` e `credit_card_purchase` ⇒ `amount < 0`.
- `income` e `refund` ⇒ `amount > 0`.
- `amount === 0` ⇒ sinalizar.
- `date` deve ser data civil válida (`2026-02-30` é inválida).

Casos de teste: um por regra acima, mais `transfer` com qualquer sinal (válido), `investment` com qualquer sinal (válido), `credit_card_payment` com sinal negativo na conta corrente (válido), data inválida, descrição vazia (decida: erro ou aviso, e documente).

Pergunta para você decidir e registrar: por que `date` é string civil e não `Date`? (Dica: fuso horário e `new Date("2026-10-06")`.)

Fora desta tarefa: a inversão de sinal das linhas de cartão da Pluggy é trabalho do adapter (E3). O domínio só recebe a convenção interna.

**Pronto quando:** a função devolve **todos** os problemas de uma transação, não só o primeiro.

---

## Tarefa 3 — Identidade e deduplicação com contagem de ocorrências

Seção 5.4 da spec. **Esta tarefa mudou**: a numeração de ocorrências não vale só dentro do lote; ela considera o que o banco já tem.

```ts
baseKey(t: NormalizedTransaction): string

assignIdentities(
  batch: readonly NormalizedTransaction[],
  existingCounts: ReadonlyMap<string, number>,   // baseKey -> linhas já gravadas na conta
  mode: "complete" | "incremental",
  hash: (input: string) => string                // injetado: domain/ não importa node:crypto
): Array<{ tx: NormalizedTransaction; baseKey: string; occurrence: number; identityKey: string; isNew: boolean }>
```

- `baseKey` usa `source, accountRef, date, time?, amount, merchant/description normalizados`. Normalização do texto: trim, minúsculas, espaços múltiplos colapsados, remoção de acentos (decida e registre).
- **Modo `complete`** (Pluggy com janela de dias inteiros; reimportação de arquivo): `occurrence` = posição entre as linhas iguais do lote (1, 2, 3...). A linha é nova só se `occurrence > existingCounts[baseKey]`.
- **Modo `incremental`** (linhas que sobraram depois da âncora de um print): `occurrence = existingCounts[baseKey] + posição entre as novas iguais`; todas são novas.
- `externalId` **não** substitui a identidade. A Pluggy pode mudar o id; ele é só uma dica guardada em `metadata`.
- A função é pura: não consulta o banco, não muda a ordem do lote e não muta a entrada.

Casos de teste:

- Mesma transação em dois lotes diferentes ⇒ mesma `identityKey` (determinismo).
- Dois cafés idênticos no mesmo lote, banco vazio ⇒ `identityKey` distintas, ambos `isNew`.
- **Reimportação integral:** banco com 2, lote `complete` com 2 iguais ⇒ nenhuma nova.
- **Período sobreposto:** banco com 2, lote `complete` com 3 iguais ⇒ só a 3ª é nova.
- **Lote `incremental`:** banco com 2, lote com 1 linha igual ⇒ `occurrence` 3, nova.
- Mudar `amount` em 1 centavo ⇒ `baseKey` diferente.
- Diferença só de caixa, acento ou espaços na descrição ⇒ mesma `baseKey`.
- `externalId` diferente com o resto igual ⇒ mesma identidade (o id da fonte não manda).
- Apagar e recriar a mesma linha (mesmo `date`, `amount`, descrição) ⇒ mesma identidade (reapresentação).
- A identidade **não depende** de nenhum identificador de conexão (`itemId`): reconectar não duplica.
- Lote vazio.
- Ordem preservada; entrada não mutada.

Fora desta tarefa (E2, com Postgres em Docker): o índice único `(account_id, identity_key)` e duas sincronizações concorrentes. Aqui você só precisa saber explicar por que o índice é a garantia final e a função pura não basta.

**Pronto quando:** os testes acima passam e você consegue explicar (1) por que existem dois modos e (2) por que o índice de ocorrência sozinho **não** resolve a reimportação de prints sobrepostos (isso é a Tarefa 4).

---

## Tarefa 4 — Mesclagem de prints e âncora (a mais difícil)

Seção 5.4 ("Deduplicação com prints") da spec. Esta tarefa merece mais tempo. Código em `domain/caju/`.

Duas operações sobre listas de linhas já normalizadas e **na ordem do extrato**:

```ts
// 1. unir prints sobrepostos do MESMO lote de envio
mergeOverlapping(prints: ReadonlyArray<readonly Row[]>): MergeResult

// 2. comparar o lote novo com o que já está no banco
reconcileWithExisting(existingTail: readonly Row[], incoming: readonly Row[]): ReconcileResult
// ReconcileResult: { newRows: Row[]; anchor: { length: number; ... } | null; gapWarning: boolean; ambiguous: boolean }
```

Ideia: achar a maior sequência contígua de linhas iguais entre o fim de um lado e o início do outro (âncora). O que está depois da âncora é novo, e entra em `assignIdentities` no modo `incremental`.

Casos de teste (monte-os como listas pequenas de strings ou linhas fictícias):

1. Sem sobreposição e sem âncora ⇒ `gapWarning = true`, nenhuma linha é descartada.
2. Sobreposição de 3 linhas ⇒ só as linhas depois da âncora são novas.
3. Reenvio **idêntico** do mesmo print ⇒ `newRows = []`.
4. Print novo totalmente contido no que já existe ⇒ `newRows = []`.
5. **Linhas legítimas idênticas dentro e fora da âncora** (dois cafés iguais, um na sobreposição e outro novo) ⇒ conta certo, não perde o segundo.
6. Âncora ambígua (a mesma sequência curta aparece em dois pontos) ⇒ `ambiguous = true`, **não** decide sozinho.
7. Âncora de uma única linha genérica (ex.: valor repetido comum) ⇒ tratar como fraca; defina um comprimento mínimo e justifique.
8. Três prints encadeados A-B-C, onde A e C não se sobrepõem diretamente.
9. Ordem decrescente do extrato (mais recente primeiro) ⇒ defina qual é a ordem canônica interna e converta na borda.
10. Listas vazias.

**Pronto quando:** os 10 casos passam e a decisão sobre âncora mínima e ambiguidade está documentada em `docs/decisoes/`. Mande a primeira versão **antes** de polir: esta é a tarefa em que vale mais revisar o desenho cedo.

---

## Tarefa 5 — Detector de transferências internas

Seção 5.5 da spec.

```ts
detectTransfers(txs: readonly NormalizedTransaction[], opts: { windowDays: number }): TransferMatch[]
// TransferMatch: { outflowIndex: number; inflowIndex: number; confidence: "high" | "medium" }
```

Regras: contas diferentes, valores opostos de mesmo módulo, datas dentro da janela, cada transação em **no máximo um** par.

Casos de teste:

- Par simples Santander −1000 / Nubank +1000 no mesmo dia ⇒ casa.
- Janela: 1 dia de diferença casa; 5 dias não (com `windowDays: 2`).
- **Duas saídas de 100 e duas entradas de 100** na mesma janela ⇒ pareamento 1:1 sem reutilizar nenhuma transação.
- Mesma conta nos dois lados ⇒ não casa.
- Saída sem par (ex.: para conta não conectada) ⇒ fica de fora, nunca vira despesa automaticamente.
- Valores iguais, mas um deles é `credit_card_purchase` ⇒ não casa.
- Determinismo: o resultado não depende da ordem de entrada.

**Pronto quando:** você define e testa o critério de desempate quando há mais de um candidato (por exemplo, menor diferença de dias primeiro).

---

## Tarefa 6 — Gastos do período: cartão, investimento e regra do mês

Seções 5.3, 5.5 e 5.6. O mapeamento real da Pluggy ainda é desconhecido (a sondagem E1b responde), então modele o domínio com dados **fictícios**.

```ts
spendingForPeriod(txs: readonly NormalizedTransaction[], period): { totalExpenses: Cents; ... }
```

Regra do mês: a transação pertence ao mês da **sua própria `date`**. Linhas de cartão `pending` entram. Cada parcela conta no mês da sua `date`.

Casos de teste (todos com valores fictícios):

- Compra de 100 em 01/10 + pagamento da fatura de 100 em 10/10 ⇒ despesa = 100, não 200.
- Pagamento parcial (50 de 100) ⇒ despesa continua 100.
- Pagamento maior que a fatura ⇒ sinalizar a diferença, nunca contar como despesa.
- Estorno (`refund`) dentro do mês ⇒ reduz a despesa.
- Compra em setembro, pagamento em outubro ⇒ a despesa pertence a **setembro** (data da compra).
- Transferência interna casada ⇒ fora da despesa e da receita.
- **Movimento para caixinha** (`type: investment`, −400) ⇒ fora da despesa **e** da receita; o resgate (+400) idem.
- Compra parcelada em 3x com uma parcela por mês ⇒ cada parcela cai no seu mês, não tudo no primeiro.
- Linha de cartão `pending` na fatura aberta ⇒ entra na despesa do mês da sua `date`.

**Pronto quando:** existe uma única função que responde "quanto gastei no período" e **todas** as telas futuras usam ela.

---

## Tarefa 7 — Categorizador

Seção 5.7. Ordem: regra do usuário → estabelecimento conhecido → categoria da fonte → heurística → `Outros`.

```ts
categorize(t: NormalizedTransaction, ctx: { userRules; knownMerchants; sourceCategoryMap }): CategoryResult
// CategoryResult inclui o motivo (qual regra decidiu), para poder explicar na UI
```

Casos de teste: cada nível vence o seguinte; `"UBER *TRIP"` e `"UBER EATS"` (padrão mais específico vence: defina e teste a regra de especificidade); regra do usuário sobrepõe qualquer outra; sem correspondência ⇒ `Outros`; tipo `investment` nunca cai em categoria de gasto.

---

## Fora deste roteiro

- **Parser de linhas do Caju** (texto extraído de um print → `NormalizedTransaction[]`): estágio E5. **Não comece** antes de ver 2 a 3 prints reais anonimizados; o layout define tudo (sinal, data, horário). Quando chegarem, eu monto os casos de teste a partir do layout real.
- **Adapter da Pluggy, persistência, índice único e concorrência:** E2 e E3.

---

## Como a revisão funciona

- Uma tarefa por vez, em um PR: código + testes, com os casos escritos antes pelo CTO.
- O dev anexa 3 a 5 linhas com as decisões que tomou (ex.: "centavos como `number` com brand porque…"), no relatório do cartão.
- QA, revisor e CTO devolvem: bugs reais, casos de borda que faltam, testes que passam por acidente e perguntas sobre decisões.
- O dono lê o diff e o parecer e pede alterações.

## Ordem sugerida

Parte A: 0 → 1 → 2 → 3. Parte B: 6 → 5 → 7 (podem andar em paralelo com o E2). A Tarefa 4 (mesclador) é a mais difícil e foi para o E5 (T5.4): o CTO manda o desenho cedo para o dono aprovar antes de qualquer código.

Em paralelo, assim que a Tarefa 0 fechar (ou antes, por causa do trial): o dono cria a conta na Pluggy, autoriza Santander e Nubank no MeuPluggy e roda a sondagem (E1b), por causa do trial.
