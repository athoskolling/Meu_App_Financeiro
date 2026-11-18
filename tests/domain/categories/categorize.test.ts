import { describe, expect, it } from 'vitest';
import { categorize, type CategorizeContext } from '../../../domain/categories';
import type { Cents } from '../../../domain/money';
import type { NormalizedTransaction } from '../../../domain/transactions';

function tx(over: Partial<NormalizedTransaction> = {}): NormalizedTransaction {
  return {
    source: 'manual',
    accountRef: 'santander',
    date: '2026-10-10',
    description: 'x',
    amount: -1000 as Cents,
    currency: 'BRL',
    type: 'expense',
    status: 'posted',
    ...over,
  };
}

const ctx: CategorizeContext = {
  userRules: [{ pattern: 'padaria do ze', categoryId: 'cat-padaria' }],
  knownMerchants: [
    { pattern: 'uber', categoryId: 'cat-transporte' },
    { pattern: 'uber eats', categoryId: 'cat-delivery' },
    { pattern: 'padaria', categoryId: 'cat-padaria-generica' },
  ],
  sourceCategoryMap: new Map([['Groceries', 'cat-mercado']]),
  heuristics: [{ pattern: 'posto', categoryId: 'cat-combustivel' }],
  investmentCategoryId: 'cat-investimentos',
  transferCategoryId: 'cat-transferencias',
  fallbackCategoryId: 'cat-outros',
};

const d = (description: string, extra: Partial<NormalizedTransaction> = {}) =>
  tx({ description, ...extra });

describe('categorize', () => {
  it('regra do usuário vence estabelecimento conhecido', () => {
    expect(categorize({ tx: d('PADARIA DO ZÉ') }, ctx)).toEqual({
      categoryId: 'cat-padaria',
      reason: 'user_rule',
      pattern: 'padaria do ze',
    });
  });

  it('estabelecimento conhecido', () => {
    const r = categorize({ tx: d('PADARIA CENTRAL') }, ctx);
    expect(r.categoryId).toBe('cat-padaria-generica');
    expect(r.reason).toBe('known_merchant');
  });

  it('padrão mais específico (mais longo) vence', () => {
    const r = categorize({ tx: d('UBER EATS') }, ctx);
    expect(r.categoryId).toBe('cat-delivery');
    expect(r.pattern).toBe('uber eats');
  });

  it('UBER *TRIP casa uber', () => {
    const r = categorize({ tx: d('UBER *TRIP') }, ctx);
    expect(r.categoryId).toBe('cat-transporte');
    expect(r.pattern).toBe('uber');
  });

  it('casa por palavra inteira: UBERLANDIA não casa uber', () => {
    const r = categorize({ tx: d('UBERLANDIA COMERCIO') }, ctx);
    expect(r.categoryId).toBe('cat-outros');
    expect(r.reason).toBe('fallback');
  });

  it('estabelecimento vence a categoria da fonte', () => {
    const r = categorize({ tx: d('UBER *TRIP'), sourceCategory: 'Groceries' }, ctx);
    expect(r.categoryId).toBe('cat-transporte');
  });

  it('categoria da fonte', () => {
    const r = categorize({ tx: d('MERCADINHO XYZ'), sourceCategory: 'Groceries' }, ctx);
    expect(r.categoryId).toBe('cat-mercado');
    expect(r.reason).toBe('source_category');
  });

  it('categoria da fonte desconhecida cai em Outros', () => {
    const r = categorize({ tx: d('MERCADINHO XYZ'), sourceCategory: 'Unknown' }, ctx);
    expect(r.categoryId).toBe('cat-outros');
    expect(r.reason).toBe('fallback');
  });

  it('categoria da fonte vence a heurística', () => {
    const r = categorize({ tx: d('POSTO XYZ'), sourceCategory: 'Groceries' }, ctx);
    expect(r.categoryId).toBe('cat-mercado');
  });

  it('heurística', () => {
    const r = categorize({ tx: d('POSTO XYZ') }, ctx);
    expect(r.categoryId).toBe('cat-combustivel');
    expect(r.reason).toBe('heuristic');
  });

  it('sem correspondência cai em Outros', () => {
    const r = categorize({ tx: d('ABC123') }, ctx);
    expect(r.categoryId).toBe('cat-outros');
    expect(r.reason).toBe('fallback');
  });

  it('merchantName também casa', () => {
    const r = categorize({ tx: d('PAG*XYZ', { merchantName: 'Uber' }) }, ctx);
    expect(r.categoryId).toBe('cat-transporte');
  });

  it('ignora acentos e caixa', () => {
    const r = categorize({ tx: d('Pádaria Central') }, ctx);
    expect(r.categoryId).toBe('cat-padaria-generica');
  });

  it('investimento nunca é gasto: nem a regra do usuário o tira da categoria', () => {
    const r = categorize(
      { tx: d('PADARIA DO ZE', { type: 'investment', amount: -40000 as Cents }) },
      ctx,
    );
    expect(r).toMatchObject({ categoryId: 'cat-investimentos', reason: 'type' });
  });

  it('pagamento de fatura vai para transferências', () => {
    const r = categorize({ tx: d('UBER', { type: 'credit_card_payment' }) }, ctx);
    expect(r).toMatchObject({ categoryId: 'cat-transferencias', reason: 'type' });
  });

  it('transferência vai para transferências', () => {
    const r = categorize({ tx: d('x', { type: 'transfer' }) }, ctx);
    expect(r).toMatchObject({ categoryId: 'cat-transferencias', reason: 'type' });
  });

  it('empate de tamanho fica com o primeiro da lista', () => {
    const c: CategorizeContext = {
      ...ctx,
      userRules: [],
      knownMerchants: [
        { pattern: 'abc', categoryId: 'cat-1' },
        { pattern: 'xyz', categoryId: 'cat-2' },
      ],
    };
    expect(categorize({ tx: d('ABC XYZ') }, c).categoryId).toBe('cat-1');
  });

  it('padrão vazio ou só espaços nunca casa', () => {
    const c: CategorizeContext = {
      ...ctx,
      userRules: [{ pattern: '  ', categoryId: 'cat-x' }],
    };
    expect(categorize({ tx: d('QUALQUER COISA') }, c).categoryId).toBe('cat-outros');
    expect(categorize({ tx: d('') }, c).categoryId).toBe('cat-outros');
  });

  it('não muta entrada nem contexto congelados', () => {
    const frozen: CategorizeContext = Object.freeze({
      ...ctx,
      userRules: Object.freeze([...ctx.userRules]),
      knownMerchants: Object.freeze([...ctx.knownMerchants]),
      heuristics: Object.freeze([...ctx.heuristics]),
    });
    const input = Object.freeze({ tx: Object.freeze(d('UBER EATS')), sourceCategory: 'Groceries' });
    expect(() => categorize(input, frozen)).not.toThrow();
  });
});
