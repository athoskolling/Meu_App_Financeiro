# 0022: Detalhes da identidade e dedup (T1.3)

- **Status:** **aceita** pelo dono em 23/11/2026 (proposta pelo CTO em 19/11/2026).
- **Estágio:** E1 parte A
- **Spec:** 5.4 (identidade, deduplicação, identidade das linhas da Pluggy)
- **Complementa:** ADR-0018, itens 7 a 11. Não muda nenhum caso aprovado na seção C de `docs/tasks/E1/T1.0.md`; só fecha pontos que a T1.0 deixou em aberto.
- **Numeração:** 0022, e não 0020, porque a branch remota não mesclada `origin/claude/zen-mayer-trcp1r` já usa 0020 e 0021. Assim não há colisão se o dono decidir aproveitar algo de lá.

## Contexto

Ao preparar o cartão da T1.3, quatro pontos ficaram sem resposta exata nos casos da T1.0:

1. A T1.0 diz que `normalizeText` "troca qualquer espaço em branco (inclui U+00A0)". O `\s` do JavaScript não inclui o U+0085 (NEL), que a Unicode classifica como espaço em branco. Uma descrição com NEL e a mesma descrição com espaço comum gerariam `baseKey` diferentes, e a reimportação duplicaria a linha.
2. A T1.0 manda lançar `Error` com `existingCounts` igual a `-1`, `1.5` ou `NaN`, mas não fala de `Infinity`, `2 ** 60` nem de uma ocorrência que passe de `Number.MAX_SAFE_INTEGER`. Acima desse limite, duas ocorrências diferentes viram o mesmo número e geram a mesma `identityKey` (duas transações viram uma).
3. A spec diz que a exclusão é lógica (`deleted_at`), mas não diz se as linhas excluídas entram no `existingCounts`. Se não entrarem, a próxima sincronização recria a linha que o usuário excluiu.
4. O modo `incremental` não é idempotente por definição: mandar o mesmo lote incremental duas vezes cria as linhas duas vezes.

## Decisão (proposta)

1. **Espaço em branco é o da Unicode.** `normalizeText` troca por espaço comum todo caractere com a propriedade `White_Space` (regex `\p{White_Space}` com a flag `u`), o que inclui U+0085, U+00A0, U+202F, U+3000, tab e quebras de linha. U+200B (espaço de largura zero) e U+FEFF **não** são `White_Space` e ficam como estão no interior do texto; se os prints do Caju mostrarem que eles aparecem, a regra é revista no E5, com ADR nova.
   - *Esclarecimento (26/11/2026, achado baixo na revisão da T1.3):* como a etapa final de `normalizeText` definida na T1.0 é `String.prototype.trim()` (ECMAScript), `U+FEFF` (BOM) **nas extremidades** é removido por `.trim()`, enquanto `U+FEFF` **interno** (ex.: `'a\ufeffb'`) permanece preservado. Esse comportamento é defensivo contra BOM espúrio de arquivos/APIs e fica fixado antes de gravar dados no E2.
2. **Inteiros seguros em toda a contagem.**
   - Cada valor de `existingCounts` precisa ser inteiro seguro e `>= 0` (`Number.isSafeInteger`). `Infinity`, `2 ** 60`, texto e `null` lançam `Error`. Todas as entradas do mapa são conferidas, não só as chaves do lote: o erro é de programação e não pode depender do lote.
   - `identityKey` lança `Error` se `occurrence` não for inteiro seguro `>= 1`.
   - `assignIdentities` lança `Error` se alguma ocorrência calculada passar de `Number.MAX_SAFE_INTEGER`. A função lança antes de devolver qualquer coisa (não há resultado parcial).
   - As mensagens são fixas: não contêm `baseKey`, descrição, valor nem a contagem (spec 14, logs sem dados).
3. **Contrato para quem chama** (vale para T2.6, T3.4 e E5; não há código disso na T1.3):
   - `existingCounts` conta **todas** as linhas da conta com aquela `baseKey`, **inclusive as excluídas logicamente**. Uma linha excluída continua ocupando a sua ocorrência, então a reimportação a reconhece como "já existente" (`isNew: false`) e não a recria.
   - A função de domínio só diz "já existe". O que fazer com uma linha excluída que reaparece na fonte (manter excluída ou restaurar) é decisão da persistência, no cartão da T3.4 (ver dúvida 2 do cartão da T1.3).
   - O modo `incremental` só recebe linhas que ainda não foram gravadas. Quem chama impede o reenvio do mesmo lote (`file_hash` e `image_hashes` na tabela `imports`, spec 5.4).
   - A contagem e a gravação acontecem na mesma transação de banco, e o índice único `(account_id, identity_key)` é a garantia final (spec 5.4, T2.2 e T2.8).
   - Em produção, o hash é SHA-256 em hexadecimal, completo, sem truncar, implementado em `lib/`.
4. **Nomes exportados:** `Hash`, `Mode` e `IdentifiedTransaction` (o item de saída de `assignIdentities`), reexportados por `domain/transactions/index.ts`.

## Consequências

- Os casos novos que decorrem desta ADR estão no cartão da T1.3, seção "Casos propostos (C2)". Se o dono não aprovar esta ADR, a T1.3 implementa só a seção C da T1.0 e os C2 saem do cartão.
- O item 1 muda a `baseKey` só de descrições com U+0085, o que hoje não existe em dados gravados (o banco ainda não tem transações). Depois do E2, mudar a normalização exigiria migração de identidades (ADR-0018, consequências).
- O item 3 vira critério de aceite nos cartões da T2.6 e da T3.4 quando forem escritos.

## Aprovação do dono

- [x] Aprovo os itens 1 a 4. Dono, 23/11/2026.
