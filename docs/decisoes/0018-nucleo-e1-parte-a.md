# 0018: Decisões do núcleo de domínio (E1 parte A)

- **Status:** aceita. Proposta pelo CTO e aprovada pelo dono em 15/10/2026, junto com o lote de cartões T1.0, T1.0a, T1.1 e T2.1. Os casos de teste que dependem dela estão em `docs/tasks/E1/T1.0.md`.
- **Estágio:** E1 parte A
- **Spec:** 5.1, 5.2, 5.3, 5.4

## Contexto

O roteiro (`docs/Fase0_roteiro.md`, Tarefas 1 a 3) pede que algumas escolhas sejam decididas e registradas antes do código. Este arquivo registra todas elas de uma vez, para que os casos de teste da T1.0 sejam inequívocos.

## Decisões

### Dinheiro (T1.1)

1. **`Cents` é `number` com brand**, sempre inteiro seguro (`Number.isSafeInteger`), e não `bigint`. O `number` atravessa JSON, React e Zod sem conversão; o teto (cerca de 90 trilhões de reais) é irrelevante para finanças pessoais. O `bigint` do banco é convertido num único ponto (`fromDb`), com checagem de faixa. A criação passa por `cents()`, e `-0` vira `0`.
2. **`parseBRL` aceita só o formato brasileiro.** Ponto é milhar (com grupos corretos), vírgula é decimal com 1 ou 2 casas, e o sinal vem como `-`, `+` ou parênteses. Entrada com `,` e `.` em que o último separador é `.` é recusada como `ambiguous_format`. A conversão é por dígitos, nunca por `parseFloat`.
3. **`formatBRL` não usa `Intl`.** O `Intl` gera espaço não separável (U+00A0 ou U+202F, dependendo da versão do ICU), o que quebra comparação de texto e a ida e volta. A saída usa só espaço comum: `R$ 1.234,56` e `-R$ 12,30`. O `parseBRL` aceita os três tipos de espaço.
4. **Erros com código, sem ecoar a entrada.** `MoneyError` tem `code` (`empty`, `invalid_format`, `ambiguous_format`, `out_of_range`, `not_integer`). A mensagem ajuda a corrigir, mas não repete o valor, porque erros acabam em log (spec 14).

### Transação normalizada (T1.2)

5. **`date` é string civil `YYYY-MM-DD`, não `Date`.** `new Date("2026-10-06")` é meia-noite em UTC, que no fuso `America/Sao_Paulo` cai em 05/10: a transação mudaria de dia e, no dia 1º, de mês. A validação é por aritmética (ano bissexto incluído), sem `Date`.
6. **`validateTransaction` devolve todos os problemas**, em ordem fixa (a ordem dos campos), com severidade. **Descrição vazia é erro**: sem descrição, não há identidade estável nem como o usuário reconhecer a linha. **Valor zero é aviso**: algumas fontes mostram estornos ou tarifas zeradas, e o usuário decide.

### Identidade (T1.3)

7. **O texto da `baseKey` é a `description` normalizada; `merchantName` fica fora.** A spec dizia "merchant/description". Escolhemos só a descrição porque o nome do estabelecimento vem de enriquecimento da Pluggy, que pode aparecer, mudar ou sumir entre sincronizações, e isso mudaria a identidade e duplicaria linhas. A descrição é o que o banco mostra no extrato e é estável. Se a sondagem (E1b) mostrar que a descrição também muda, esta decisão é revista com ADR nova.
8. **Também ficam fora da `baseKey`:** `status` (a efetivação de um `pending` não duplica), `type` (reclassificar não duplica), `postedAt` e `externalId` (o id da fonte é só dica, spec 5.4).
9. **Normalização do texto:** NFD, remoção de acentos, minúsculas, qualquer espaço vira espaço comum, espaços colapsados, `trim`. A pontuação fica: removê-la juntaria descrições diferentes de verdade, e a variação de OCR é tratada pelo mesclador (T5.4).
10. **Texto canônico em JSON:** `baseKeyInput = JSON.stringify([source, accountRef, date, time ?? null, amount, texto])`. O JSON não deixa um campo "vazar" para o outro (diferente de juntar com um separador), e os testes conferem o texto exato com um hash falso. `identityKey = hash(JSON.stringify([baseKey, occurrence]))`.
11. **Hash injetado:** `domain/` não importa `node:crypto` (ADR-0017). Quem chama passa a função; em produção, SHA-256 em `lib/`.

## Consequências

- Os casos da T1.0 são a especificação das T1.1 a T1.3. Mudar um caso exige nova aprovação do dono, registrada no cartão.
- A decisão 7 é uma leitura mais estreita da spec 5.4. A spec é atualizada no gate E1 parte A para dizer "descrição normalizada".
- Trocar a fórmula da `baseKey` depois que houver dados gravados muda todas as identidades: exigiria migração. Por isso ela é fixada antes do E2.
