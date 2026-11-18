# 0020: Decisões das regras de relatório (E1 parte B)

- **Status:** aceita. Proposta pelo CTO e aprovada pelo dono em 18/11/2026, junto com os casos da T1.5 (`docs/tasks/E1/T1.5.md`).
- **Estágio:** E1 parte B (T1.6, T1.7, T1.8)
- **Spec:** 5.3, 5.5, 5.6, 5.7

## Contexto

O roteiro (Tarefas 5, 6 e 7) deixa escolhas em aberto: o formato do período, o que fazer com tipos ambíguos, como desempatar transferências e como medir "padrão mais específico". Estas decisões fixam tudo isso antes dos casos de teste.

## Decisões

### Gastos do período (T1.6)

1. **Período é um intervalo fechado de datas civis** `{ start, end }` (`YYYY-MM-DD`, os dois inclusos), comparado como texto, sem `Date`. `monthPeriod('2026-10')` devolve `{ start: '2026-10-01', end: '2026-10-31' }` (fevereiro com ano bissexto).
2. **A entrada diz quais linhas são transferência casada**: `spendingForPeriod(items, period)` recebe `{ tx, isTransfer }[]`. Quem casa os pares é o `detectTransfers` (T1.7) ou o usuário; o cálculo só obedece à marca.
3. **O que conta**, para linhas com `date` dentro do período e `isTransfer = false`:
   - `expense` e `credit_card_purchase` somam em `expenses` (em módulo);
   - `refund` **subtrai** de `expenses`;
   - `income` soma em `income`;
   - `credit_card_payment` fica fora e soma em `cardPayments` (em módulo), só para informação;
   - `investment` fica fora; saídas somam em `investedOut` e entradas em `investedIn` (em módulo);
   - `transfer` sem par e `other` ficam fora e vão para `unclassified` (quantidade e soma com sinal), para a interface pedir classificação. **Nunca viram despesa automática.**
   - `isTransfer = true` fica fora de tudo, qualquer que seja o `type`, e soma em `transfers.count`.
4. **`expenses` pode ficar negativo** se os estornos do mês passarem as compras. Não há corte em zero: o número tem de ser honesto.
5. **`status` não importa**: `pending` entra (regra do mês, spec 5.3).
6. **Pagamento a maior da fatura** nunca vira despesa. Detectar a diferença exige saber o valor da fatura, que só a sondagem (E1b) mostra; essa conferência fica para o E3. Aqui só se garante que o pagamento não mexe em `expenses`.
7. **Linha inválida é erro de programação**: se `validateTransaction(tx).ok` for `false`, a função lança `Error`. Quem chama valida antes.
8. **Exclusão lógica** é filtrada pela camada de persistência; o domínio não vê linhas apagadas.

### Transferências internas (T1.7)

9. **Tipos que podem casar:** `transfer`, `expense`, `income` e `other`. Ficam fora: `credit_card_purchase`, `credit_card_payment`, `refund` e `investment`. Valor zero não casa.
10. **Regra de par:** contas (`accountRef`) diferentes, a saída negativa e a entrada positiva com o mesmo módulo, e `|dias entre as datas| <= windowDays` (inclusivo, calculado por aritmética de data civil).
11. **Desempate guloso e determinístico:** monta todos os candidatos, ordena por (diferença de dias, data da saída, data da entrada, texto canônico da saída, texto canônico da entrada) e aceita um par quando nenhuma das duas pernas já foi usada. O texto canônico é o `baseKeyInput` da T1.3 seguido do `externalId` (ou vazio). Assim o resultado não depende da ordem de entrada. Não é o emparelhamento máximo possível, e isso é aceito: casos estranhos vão para a correção manual.
12. **Confiança:** `high` quando as duas pernas são `transfer` e a diferença é de no máximo 1 dia; `medium` nos outros casos. O que fazer com `medium` (marcar sozinho ou pedir confirmação) é decidido no E3, com dados reais.

### Categorizador (T1.8)

13. **Entrada:** `categorize({ tx, sourceCategory? }, ctx)`. A categoria da fonte não está no `NormalizedTransaction` e não entra nele agora (mudaria o tipo do núcleo).
14. **Ordem:** tipo → regra do usuário → estabelecimento conhecido → categoria da fonte → heurística → `Outros`. O **tipo vem primeiro** só para três tipos: `investment` vai para a categoria de investimentos; `credit_card_payment` e `transfer` vão para a categoria de transferências. Nem regra do usuário tira um investimento dessa categoria (invariante da spec 5.7: investimento nunca cai em categoria de gasto).
15. **Casamento de padrão por palavra inteira:** padrão e texto passam por `normalizeText` (T1.3); casa se `' ' + texto + ' '` contém `' ' + padrão + ' '`. O texto é a `description` e, se existir, também o `merchantName` (casa se qualquer um casar). Assim `uber` casa `UBER *TRIP` mas não `UBERLANDIA`.
16. **Especificidade:** dentro do mesmo nível, vence o padrão normalizado **mais longo**; empate fica com o primeiro da lista. `uber eats` vence `uber` em `UBER EATS`.
17. **O resultado explica o motivo:** `{ categoryId, reason, pattern? }`, com `reason` em `type`, `user_rule`, `known_merchant`, `source_category`, `heuristic` ou `fallback`.

### Datas civis (compartilhado)

18. **`domain/dates/`** ganha `daysInMonth`, `daysBetween` e `monthPeriod`, por aritmética (dias desde uma época civil), sem `Date`. Nasce na T1.6 e é usada pela T1.7.

### Esclarecimentos (18/11/2026, sem mudar caso; levantados pelo QA da T1.8)

19. **Só o espaço é fronteira de palavra.** `UBER*TRIP` (sem espaço) não casa `uber` e cai no próximo nível. Revisto com descrições reais na sondagem (E1b); mudar exige ADR nova e casos novos.
20. **Não há prioridade entre `description` e `merchantName`.** Os dois textos concorrem juntos, e vence o padrão mais longo (item 16), venha de qual campo vier.
21. **O `pattern` devolvido é o normalizado**, não o texto gravado na regra. Quem persistir regras (T4.2) não compara por igualdade com `merchant_rules.merchant_pattern`.

22. **Texto canônico do desempate de transferências inclui o `type`** (correção do BUG-T1.7-01, apontado pelo QA): `baseKeyInput(tx)`, depois `type`, depois `externalId ?? ''`. Sem o tipo, duas saídas iguais em tudo menos no tipo empatavam, e o par e a confiança dependiam da ordem de entrada, violando o próprio item 11. Nenhum caso aprovado muda.

## Consequências

- O painel (T4.1) chama `detectTransfers`, depois `spendingForPeriod`. A interface nunca recalcula.
- A conferência de pagamento a maior e o destino dos pares `medium` voltam no E3, depois da sondagem.
