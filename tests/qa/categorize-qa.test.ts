// QA independente da T1.8 (categorizador, ADR-0020 itens 13 a 17). Dados sintéticos.
// Sem Date.now(), sem Math.random(): as propriedades usam um PRNG de semente fixa.
// Não alterar os testes do dev (tests/domain/categories/) aqui.
// Achados de decisão (ambiguidade de ADR, não bug) estão marcados como RISCO nos títulos.
import { describe, expect, it } from 'vitest';
import { categorize, type CategorizeContext, type Rule } from '../../domain/categories';
import type { Cents } from '../../domain/money';
import type { NormalizedTransaction } from '../../domain/transactions';

const CTX: CategorizeContext = {
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

const TIPOS = [
  'income',
  'expense',
  'transfer',
  'credit_card_purchase',
  'credit_card_payment',
  'refund',
  'investment',
  'other',
] as const;

function tx(over: Partial<NormalizedTransaction> = {}): NormalizedTransaction {
  return {
    source: 'manual',
    accountRef: 'conta-1',
    date: '2026-10-06',
    description: 'Descrição sintética',
    amount: -1000 as Cents,
    currency: 'BRL',
    type: 'expense',
    status: 'posted',
    ...over,
  };
}

/** PRNG de semente fixa (mulberry32): mesmas entradas em toda execução. */
function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VOCAB = [
  'uber',
  'eats',
  'padaria',
  'do',
  'ze',
  'posto',
  'mercado',
  'pag',
  'xyz',
  'central',
  'abc',
  'uberlandia',
  'bar',
  'barbearia',
  'cafe',
  'pix',
];

function gerador(rand: () => number) {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
  const frase = (n: number) => Array.from({ length: n }, () => pick(VOCAB)).join(' ');
  const regra = (): Rule => ({
    pattern: frase(1 + Math.floor(rand() * 3)),
    categoryId: `cat-${Math.floor(rand() * 9)}`,
  });
  const lista = (max: number) => Array.from({ length: Math.floor(rand() * (max + 1)) }, regra);
  return {
    ctx(): CategorizeContext {
      return {
        userRules: lista(5),
        knownMerchants: lista(6),
        sourceCategoryMap: new Map([['Groceries', 'cat-mercado']]),
        heuristics: lista(4),
        investmentCategoryId: 'cat-investimentos',
        transferCategoryId: 'cat-transferencias',
        fallbackCategoryId: 'cat-outros',
      };
    },
    descricao: () => frase(1 + Math.floor(rand() * 4)),
    tipo: () => pick(TIPOS),
    pick,
  };
}

function congelar<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj)) congelar(v);
    Object.freeze(obj);
  }
  return obj;
}

describe('G (T1.5) casos do categorizador, reescritos a partir da spec', () => {
  it.each([
    [
      'regra do usuário vence estabelecimento',
      'PADARIA DO ZÉ',
      {},
      'cat-padaria',
      'user_rule',
      'padaria do ze',
    ],
    [
      'estabelecimento conhecido',
      'PADARIA CENTRAL',
      {},
      'cat-padaria-generica',
      'known_merchant',
      'padaria',
    ],
    [
      'mais específico vence (uber eats)',
      'UBER EATS',
      {},
      'cat-delivery',
      'known_merchant',
      'uber eats',
    ],
    ['UBER *TRIP casa "uber"', 'UBER *TRIP', {}, 'cat-transporte', 'known_merchant', 'uber'],
    [
      'palavra inteira: UBERLANDIA não casa uber',
      'UBERLANDIA COMERCIO',
      {},
      'cat-outros',
      'fallback',
      undefined,
    ],
    [
      'estabelecimento vence categoria da fonte',
      'UBER *TRIP',
      { sourceCategory: 'Groceries' },
      'cat-transporte',
      'known_merchant',
      'uber',
    ],
    [
      'categoria da fonte',
      'MERCADINHO XYZ',
      { sourceCategory: 'Groceries' },
      'cat-mercado',
      'source_category',
      undefined,
    ],
    [
      'categoria da fonte desconhecida',
      'MERCADINHO XYZ',
      { sourceCategory: 'Unknown' },
      'cat-outros',
      'fallback',
      undefined,
    ],
    [
      'fonte vence heurística',
      'POSTO XYZ',
      { sourceCategory: 'Groceries' },
      'cat-mercado',
      'source_category',
      undefined,
    ],
    ['heurística', 'POSTO XYZ', {}, 'cat-combustivel', 'heuristic', 'posto'],
    ['sem correspondência', 'ABC123', {}, 'cat-outros', 'fallback', undefined],
    ['acentos e caixa', 'Pádaria Central', {}, 'cat-padaria-generica', 'known_merchant', 'padaria'],
  ])('%s: "%s"', (_nome, descricao, extra, categoryId, reason, pattern) => {
    const { sourceCategory, ...campos } = extra as { sourceCategory?: string };
    const r = categorize({ tx: tx({ description: descricao, ...campos }), sourceCategory }, CTX);
    expect(r).toEqual({ categoryId, reason, ...(pattern ? { pattern } : {}) });
  });

  it('merchantName também casa: description "PAG*XYZ", merchantName "Uber" -> cat-transporte', () => {
    const r = categorize({ tx: tx({ description: 'PAG*XYZ', merchantName: 'Uber' }) }, CTX);
    expect(r).toEqual({ categoryId: 'cat-transporte', reason: 'known_merchant', pattern: 'uber' });
  });

  it('investimento nunca é gasto: type investment vence a regra do usuário (-40000)', () => {
    const r = categorize(
      { tx: tx({ type: 'investment', amount: -40000 as Cents, description: 'PADARIA DO ZE' }) },
      CTX,
    );
    expect(r).toEqual({ categoryId: 'cat-investimentos', reason: 'type' });
  });

  it('pagamento de fatura vai para transferências (type)', () => {
    const r = categorize({ tx: tx({ type: 'credit_card_payment', description: 'UBER' }) }, CTX);
    expect(r).toEqual({ categoryId: 'cat-transferencias', reason: 'type' });
  });

  it('transferência vai para transferências (type)', () => {
    const r = categorize({ tx: tx({ type: 'transfer' }) }, CTX);
    expect(r).toEqual({ categoryId: 'cat-transferencias', reason: 'type' });
  });

  it('empate de tamanho: o primeiro da lista vence (ABC XYZ -> cat-1)', () => {
    const ctx = {
      ...CTX,
      knownMerchants: [
        { pattern: 'abc', categoryId: 'cat-1' },
        { pattern: 'xyz', categoryId: 'cat-2' },
      ],
    };
    const r = categorize({ tx: tx({ description: 'ABC XYZ' }) }, ctx);
    expect(r).toEqual({ categoryId: 'cat-1', reason: 'known_merchant', pattern: 'abc' });
  });

  it('padrão vazio ou só espaços é ignorado (nunca casa)', () => {
    const ctx = { ...CTX, userRules: [{ pattern: '  ', categoryId: 'cat-x' }], knownMerchants: [] };
    expect(categorize({ tx: tx({ description: 'QUALQUER COISA' }) }, ctx).reason).toBe('fallback');
    expect(categorize({ tx: tx({ description: '   ' }) }, ctx).reason).toBe('fallback');
  });

  it('sem mutação: entrada e contexto congelados não lançam e dão o mesmo resultado', () => {
    const entrada = congelar({
      tx: tx({ description: 'PADARIA DO ZÉ' }),
      sourceCategory: 'Groceries',
    });
    const ctx = congelar({
      ...CTX,
      userRules: [...CTX.userRules],
      knownMerchants: [...CTX.knownMerchants],
      heuristics: [...CTX.heuristics],
    });
    expect(() => categorize(entrada, ctx)).not.toThrow();
    expect(categorize(entrada, ctx)).toEqual(
      categorize({ tx: tx({ description: 'PADARIA DO ZÉ' }), sourceCategory: 'Groceries' }, CTX),
    );
  });
});

describe('ataques: propriedades (PRNG de semente fixa)', () => {
  it('investimento nunca sai de investimentos, com qualquer contexto (300 casos)', () => {
    const g = gerador(prng(101));
    for (let i = 0; i < 300; i++) {
      const r = categorize(
        {
          tx: tx({ type: 'investment', description: g.descricao(), merchantName: g.descricao() }),
          sourceCategory: g.pick(['Groceries', 'Unknown']),
        },
        g.ctx(),
      );
      expect(r).toEqual({ categoryId: 'cat-investimentos', reason: 'type' });
    }
  });

  it('pagamento de fatura e transferência nunca caem em gasto (300 casos)', () => {
    const g = gerador(prng(202));
    for (let i = 0; i < 300; i++) {
      const type = g.pick(['credit_card_payment', 'transfer'] as const);
      const r = categorize({ tx: tx({ type, description: g.descricao() }) }, g.ctx());
      expect(r).toEqual({ categoryId: 'cat-transferencias', reason: 'type' });
    }
  });

  it('especificidade: acrescentar uma regra mais curta nunca muda uma regra mais longa que já casava (300 casos)', () => {
    const g = gerador(prng(303));
    const niveis = {
      user_rule: 'userRules',
      known_merchant: 'knownMerchants',
      heuristic: 'heuristics',
    } as const;
    let testados = 0;
    for (let i = 0; i < 300; i++) {
      const ctx = g.ctx();
      // Embute um padrão real do contexto na descrição, para haver casamento de várias palavras.
      const todas = [...ctx.userRules, ...ctx.knownMerchants, ...ctx.heuristics];
      const embutido = todas.length > 0 ? g.pick(todas).pattern : '';
      const t = tx({ description: `${g.descricao()} ${embutido} ${g.descricao()}` });
      const base = categorize({ tx: t }, ctx);
      if (!(base.reason in niveis) || base.pattern === undefined) continue;
      const palavras = base.pattern.split(' ');
      const curta = palavras[0] as string;
      if (curta.length >= base.pattern.length) continue;
      const chave = niveis[base.reason as keyof typeof niveis];
      for (const posicao of ['antes', 'depois'] as const) {
        const lista = ctx[chave];
        const nova = { pattern: curta, categoryId: 'cat-intrusa' };
        const ctx2 = { ...ctx, [chave]: posicao === 'antes' ? [nova, ...lista] : [...lista, nova] };
        expect(categorize({ tx: t }, ctx2)).toEqual(base);
      }
      testados++;
    }
    expect(testados).toBeGreaterThan(20);
  });

  it('normalização: caixa, acento, espaço duplo, NBSP e espaços nas bordas não mudam o resultado (300 casos)', () => {
    const g = gerador(prng(404));
    const variante = (s: string) =>
      '  ' +
      s
        .toUpperCase()
        .replace(/A/g, 'Á')
        .replace(/E/g, 'É')
        .replace(/O/g, 'Õ')
        .replace(/ /g, '    ') +
      '\t ';
    for (let i = 0; i < 300; i++) {
      const ctx = g.ctx();
      const d = g.descricao();
      const original = categorize({ tx: tx({ description: d }) }, ctx);
      const mudada = categorize({ tx: tx({ description: variante(d) }) }, ctx);
      expect(mudada).toEqual(original);
    }
  });

  it('contexto vazio: sempre fallback, exceto investimento e transferência, que usam o tipo (200 casos)', () => {
    const g = gerador(prng(505));
    const vazio: CategorizeContext = {
      userRules: [],
      knownMerchants: [],
      sourceCategoryMap: new Map(),
      heuristics: [],
      investmentCategoryId: 'cat-investimentos',
      transferCategoryId: 'cat-transferencias',
      fallbackCategoryId: 'cat-outros',
    };
    for (let i = 0; i < 200; i++) {
      const t = tx({ type: g.tipo(), description: g.descricao(), merchantName: g.descricao() });
      const r = categorize({ tx: t, sourceCategory: 'Groceries' }, vazio);
      if (t.type === 'investment')
        expect(r).toEqual({ categoryId: 'cat-investimentos', reason: 'type' });
      else if (t.type === 'transfer' || t.type === 'credit_card_payment')
        expect(r).toEqual({ categoryId: 'cat-transferencias', reason: 'type' });
      else expect(r).toEqual({ categoryId: 'cat-outros', reason: 'fallback' });
    }
  });
});

describe('ataques: padrões com pontuação, acentos e espaços', () => {
  it('padrão com pontuação casa o mesmo texto: "pag*xyz" em "PAG*XYZ"', () => {
    const ctx = { ...CTX, userRules: [{ pattern: 'pag*xyz', categoryId: 'cat-pag' }] };
    expect(categorize({ tx: tx({ description: 'PAG*XYZ' }) }, ctx)).toEqual({
      categoryId: 'cat-pag',
      reason: 'user_rule',
      pattern: 'pag*xyz',
    });
  });

  it('padrão com acento, espaços extras e NBSP casa: "  Padaria   do  Zé " em "PADARIA\\u00A0DO  ZÉ"', () => {
    const ctx = {
      ...CTX,
      userRules: [{ pattern: '  Padaria   do  Zé ', categoryId: 'cat-padaria' }],
    };
    const r = categorize({ tx: tx({ description: 'PADARIA DO  ZÉ' }) }, ctx);
    expect(r).toEqual({ categoryId: 'cat-padaria', reason: 'user_rule', pattern: 'padaria do ze' });
  });

  it('palavra inteira no fim e no meio do texto: "PAGTO UBER" casa uber; "BARBEARIA" não casa bar', () => {
    const ctx = {
      ...CTX,
      knownMerchants: [
        { pattern: 'uber', categoryId: 'cat-t' },
        { pattern: 'bar', categoryId: 'cat-b' },
      ],
    };
    expect(categorize({ tx: tx({ description: 'PAGTO UBER' }) }, ctx).categoryId).toBe('cat-t');
    expect(categorize({ tx: tx({ description: 'BARBEARIA SILVA' }) }, ctx).categoryId).toBe(
      'cat-outros',
    );
  });

  it('RISCO (ADR-0020 #15, não é bug): "UBER*TRIP" sem espaço não casa "uber" e cai em Outros', () => {
    // A fronteira de palavra é só o espaço. Descrições sem espaço após o estabelecimento
    // (formato de algumas fontes) ficam sem categoria. Decisão para o CTO antes da T4.
    expect(categorize({ tx: tx({ description: 'UBER*TRIP' }) }, CTX)).toEqual({
      categoryId: 'cat-outros',
      reason: 'fallback',
    });
  });

  it('a pattern devolvida é a normalizada, não a gravada (RISCO para o T4.2: não comparar por igualdade)', () => {
    const ctx = {
      ...CTX,
      userRules: [{ pattern: '  Padaria  do ZÉ ', categoryId: 'cat-padaria' }],
    };
    expect(categorize({ tx: tx({ description: 'padaria do ze' }) }, ctx).pattern).toBe(
      'padaria do ze',
    );
  });
});

describe('ataques: description e merchantName com regras diferentes', () => {
  it('a regra mais longa vence, venha do campo que vier: merchant "Uber Eats" vence description "UBER"', () => {
    const r = categorize({ tx: tx({ description: 'UBER', merchantName: 'Uber Eats' }) }, CTX);
    expect(r).toEqual({
      categoryId: 'cat-delivery',
      reason: 'known_merchant',
      pattern: 'uber eats',
    });
  });

  it('RISCO (ambiguidade da ADR-0020 #15): description "PADARIA CENTRAL" e merchant "Uber" -> padaria (mais longa)', () => {
    // A ADR diz "casa se qualquer um casar" e "mais longo vence", mas não diz qual campo tem
    // prioridade. O código escolhe pelo tamanho do padrão, independente do campo.
    const r = categorize({ tx: tx({ description: 'PADARIA CENTRAL', merchantName: 'Uber' }) }, CTX);
    expect(r).toEqual({
      categoryId: 'cat-padaria-generica',
      reason: 'known_merchant',
      pattern: 'padaria',
    });
  });

  it('nível vence comprimento: regra do usuário curta vence estabelecimento longo', () => {
    const ctx = { ...CTX, userRules: [{ pattern: 'uber', categoryId: 'cat-user-uber' }] };
    const r = categorize({ tx: tx({ description: 'UBER EATS' }) }, ctx);
    expect(r).toEqual({ categoryId: 'cat-user-uber', reason: 'user_rule', pattern: 'uber' });
  });

  it('merchantName ausente ou vazio não quebra e não casa por engano', () => {
    expect(categorize({ tx: tx({ description: 'ABC123', merchantName: '' }) }, CTX).reason).toBe(
      'fallback',
    );
    expect(
      categorize({ tx: tx({ description: 'ABC123', merchantName: undefined }) }, CTX).reason,
    ).toBe('fallback');
  });
});

describe('ataques: listas grandes e contexto vazio', () => {
  it('10 000 estabelecimentos, o correto no fim da lista: uber eats vence uber (sem perder o mais longo)', () => {
    const muitos: Rule[] = Array.from({ length: 10000 }, (_, k) => ({
      pattern: `loja numero ${k}`,
      categoryId: `cat-loja-${k}`,
    }));
    const ctx = {
      ...CTX,
      knownMerchants: [
        ...muitos,
        { pattern: 'uber', categoryId: 'cat-transporte' },
        { pattern: 'uber eats', categoryId: 'cat-delivery' },
      ],
    };
    const r = categorize({ tx: tx({ description: 'UBER EATS PEDIDO 123' }) }, ctx);
    expect(r).toEqual({
      categoryId: 'cat-delivery',
      reason: 'known_merchant',
      pattern: 'uber eats',
    });
  });

  it('10 000 regras de mesmo tamanho que casam: o primeiro da lista vence', () => {
    const iguais: Rule[] = Array.from({ length: 10000 }, (_, k) => ({
      pattern: 'abc',
      categoryId: `cat-${k}`,
    }));
    const ctx = { ...CTX, knownMerchants: iguais };
    expect(categorize({ tx: tx({ description: 'ABC XYZ' }) }, ctx).categoryId).toBe('cat-0');
  });

  it('10 000 regras que não casam: fallback, sem exceção', () => {
    const nada: Rule[] = Array.from({ length: 10000 }, (_, k) => ({
      pattern: `zz${k}`,
      categoryId: `cat-${k}`,
    }));
    const ctx = { ...CTX, knownMerchants: nada, userRules: nada, heuristics: nada };
    expect(categorize({ tx: tx({ description: 'ABC123' }) }, ctx)).toEqual({
      categoryId: 'cat-outros',
      reason: 'fallback',
    });
  });

  it('contexto vazio com descrição e merchant vazios: fallback', () => {
    const vazio: CategorizeContext = {
      userRules: [],
      knownMerchants: [],
      sourceCategoryMap: new Map(),
      heuristics: [],
      investmentCategoryId: 'cat-investimentos',
      transferCategoryId: 'cat-transferencias',
      fallbackCategoryId: 'cat-outros',
    };
    expect(
      categorize({ tx: tx({ description: '', merchantName: '' }), sourceCategory: '' }, vazio),
    ).toEqual({ categoryId: 'cat-outros', reason: 'fallback' });
    expect(categorize({ tx: tx({ description: '', type: 'investment' }) }, vazio)).toEqual({
      categoryId: 'cat-investimentos',
      reason: 'type',
    });
  });
});
