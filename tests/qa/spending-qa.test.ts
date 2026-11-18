// QA independente da T1.6 (domain/reports/spending.ts), ADR-0020 itens 1 a 8, casos E da T1.5.
// Oráculo: um modelo de referência escrito aqui, com números simples e sem Money, seguindo a
// tabela da ADR-0020 item 3. Os lotes são gerados com semente fixa (sem Math.random).
// Bugs conhecidos ficam como it.fails, com a convenção de tests/qa/*.
//   BUG-T1.6-01: a soma acumula na ordem da entrada e a faixa é checada a cada passo (herança
//   de add/sum do money). Perto do inteiro seguro, a mesma lista pode lançar numa ordem e dar
//   resultado na outra. Quebra "ordem não importa" (caso E da T1.5).
// Não alterar os testes do dev nem o código de domain/ aqui.
import { describe, expect, it } from 'vitest';
import { monthPeriod, type Period } from '../../domain/dates';
import type { Cents } from '../../domain/money';
import { spendingForPeriod, type SpendingItem, type SpendingSummary } from '../../domain/reports';
import type { NormalizedTransaction, TransactionType } from '../../domain/transactions';

const MAX = Number.MAX_SAFE_INTEGER;
const S = 'santander';
const N = 'nubank';
const C = 'cartao';
const OUT = monthPeriod('2026-10');

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escolha<T>(rng: () => number, lista: readonly T[]): T {
  const i = Math.floor(rng() * lista.length);
  return lista[Math.min(i, lista.length - 1)] as T;
}

// Calendário de referência, dia a dia (independente do domínio).
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function diasNoMes(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return DIM[m - 1] as number;
}
function fmt(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/** Dias de 2026-08-01 a 2026-12-31 (153 dias), dia a dia. */
const DIAS: string[] = [];
{
  let y = 2026;
  let m = 8;
  let d = 1;
  while (!(y === 2027 && m === 1)) {
    DIAS.push(fmt(y, m, d));
    d += 1;
    if (d > diasNoMes(y, m)) {
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }
}

function tx(
  accountRef: string,
  type: TransactionType,
  amount: number,
  date = '2026-10-10',
  over: Partial<NormalizedTransaction> = {},
): NormalizedTransaction {
  return {
    source: 'manual',
    accountRef,
    date,
    description: 'x',
    amount: amount as Cents,
    currency: 'BRL',
    type,
    status: 'posted',
    ...over,
  };
}

function item(t: NormalizedTransaction, isTransfer = false): SpendingItem {
  return { tx: t, isTransfer };
}

interface Resumo {
  expenses: number;
  income: number;
  net: number;
  cardPayments: number;
  investedOut: number;
  investedIn: number;
  transfers: number;
  uCount: number;
  uTotal: number;
}

function deDominio(s: SpendingSummary): Resumo {
  return {
    expenses: Number(s.expenses),
    income: Number(s.income),
    net: Number(s.net),
    cardPayments: Number(s.cardPayments),
    investedOut: Number(s.investedOut),
    investedIn: Number(s.investedIn),
    transfers: s.transfers.count,
    uCount: s.unclassified.count,
    uTotal: Number(s.unclassified.total),
  };
}

/** Modelo de referência: ADR-0020 item 3, com números simples. */
function modelo(items: readonly SpendingItem[], p: Period): Resumo {
  const r: Resumo = {
    expenses: 0,
    income: 0,
    net: 0,
    cardPayments: 0,
    investedOut: 0,
    investedIn: 0,
    transfers: 0,
    uCount: 0,
    uTotal: 0,
  };
  for (const { tx: t, isTransfer } of items) {
    if (t.date < p.start || t.date > p.end) continue;
    if (isTransfer) {
      r.transfers += 1;
      continue;
    }
    switch (t.type) {
      case 'expense':
      case 'credit_card_purchase':
        r.expenses += -Number(t.amount);
        break;
      case 'refund':
        r.expenses -= t.amount;
        break;
      case 'income':
        r.income += t.amount;
        break;
      case 'credit_card_payment':
        r.cardPayments += Math.abs(t.amount);
        break;
      case 'investment':
        if (t.amount < 0) r.investedOut += -Number(t.amount);
        else r.investedIn += t.amount;
        break;
      case 'transfer':
      case 'other':
        r.uCount += 1;
        r.uTotal += t.amount;
        break;
    }
  }
  r.net = r.income - r.expenses;
  return r;
}

const TIPOS: readonly TransactionType[] = [
  'income',
  'expense',
  'transfer',
  'credit_card_purchase',
  'credit_card_payment',
  'refund',
  'investment',
  'other',
];

/** Item válido (sinal coerente com o tipo), com data em DIAS. */
function gerarItem(rng: () => number, dias: readonly string[]): SpendingItem {
  const tipo = escolha(rng, TIPOS);
  const mag = Math.floor(rng() * 200000) + 1;
  let amount: number;
  if (tipo === 'expense' || tipo === 'credit_card_purchase') amount = -mag;
  else if (tipo === 'income' || tipo === 'refund') amount = mag;
  else amount = rng() < 0.5 ? -mag : mag;
  if (rng() < 0.05) amount = 0;
  const t = tx(escolha(rng, [S, N, C]), tipo, amount, escolha(rng, dias), {
    status: rng() < 0.3 ? 'pending' : 'posted',
  });
  return item(t, rng() < 0.15);
}

function gerarLote(rng: () => number, dias: readonly string[]): SpendingItem[] {
  const n = Math.floor(rng() * 26);
  return Array.from({ length: n }, () => gerarItem(rng, dias));
}

function periodoAleatorio(rng: () => number): { p: Period; i: number; j: number } {
  const i = Math.floor(rng() * DIAS.length);
  const j = i + Math.floor(rng() * (DIAS.length - i));
  return { p: { start: DIAS[i] as string, end: DIAS[j] as string }, i, j };
}

describe('QA T1.6 gastos: modelo de referência (ADR-0020 item 3)', () => {
  it('o resultado bate com o modelo em 400 lotes com semente fixa, em períodos aleatórios', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 400; seed++) {
      const rng = prng(seed);
      const items = gerarLote(rng, DIAS);
      const { p } = periodoAleatorio(rng);
      const got = deDominio(spendingForPeriod(items, p));
      const exp = modelo(items, p);
      if (JSON.stringify(got) !== JSON.stringify(exp)) {
        problemas.push(`semente ${seed}: ${JSON.stringify(got)} != ${JSON.stringify(exp)}`);
      }
    }
    expect(problemas.slice(0, 3)).toEqual([]);
  });

  it('o resultado bate com o modelo no período de outubro de 2026, em 300 lotes', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const items = gerarLote(prng(seed * 17), DIAS);
      const got = deDominio(spendingForPeriod(items, OUT));
      if (JSON.stringify(got) !== JSON.stringify(modelo(items, OUT)))
        problemas.push(`semente ${seed}`);
    }
    expect(problemas).toEqual([]);
  });
});

describe('QA T1.6 gastos: propriedades', () => {
  it('dois períodos disjuntos e contíguos somam exatamente o período unido (todos os campos)', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const rng = prng(seed * 3);
      const items = gerarLote(rng, DIAS);
      const i = Math.floor(rng() * (DIAS.length - 1));
      const j = i + 1 + Math.floor(rng() * (DIAS.length - 1 - i));
      const k = i + Math.floor(rng() * (j - i));
      const todo = deDominio(
        spendingForPeriod(items, { start: DIAS[i] as string, end: DIAS[j] as string }),
      );
      const a = deDominio(
        spendingForPeriod(items, { start: DIAS[i] as string, end: DIAS[k] as string }),
      );
      const b = deDominio(
        spendingForPeriod(items, { start: DIAS[k + 1] as string, end: DIAS[j] as string }),
      );
      for (const campo of Object.keys(todo) as Array<keyof Resumo>) {
        if (a[campo] + b[campo] !== todo[campo]) problemas.push(`semente ${seed}, ${campo}`);
      }
    }
    expect(problemas.slice(0, 5)).toEqual([]);
  });

  it('net = income - expenses em todo lote', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = prng(seed * 5);
      const items = gerarLote(rng, DIAS);
      const { p } = periodoAleatorio(rng);
      const r = spendingForPeriod(items, p);
      expect(Number(r.net)).toBe(Number(r.income) - Number(r.expenses));
    }
  });

  it('marcar isTransfer em uma despesa ou compra nunca aumenta expenses (e o delta é o próprio valor)', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const rng = prng(seed * 7);
      const items = gerarLote(rng, DIAS);
      if (items.length === 0) continue;
      const { p } = periodoAleatorio(rng);
      const m = Math.floor(rng() * items.length);
      const alvo = items[m] as SpendingItem;
      const marcados = items.map((x, idx) => (idx === m ? item(x.tx, true) : x));
      const base = deDominio(spendingForPeriod(items, p));
      const com = deDominio(spendingForPeriod(marcados, p));
      const dentro = alvo.tx.date >= p.start && alvo.tx.date <= p.end;
      if (!dentro || alvo.isTransfer) {
        // fora do período, ou já marcada: marcar de novo não pode mudar nada
        if (JSON.stringify(base) !== JSON.stringify(com))
          problemas.push(`semente ${seed}: fora do período ou já marcada mudou`);
        continue;
      }
      const delta = com.expenses - base.expenses;
      const tipo = alvo.tx.type;
      if (tipo === 'expense' || tipo === 'credit_card_purchase') {
        if (delta > 0) problemas.push(`semente ${seed}: marcar ${tipo} aumentou expenses`);
        if (delta !== alvo.tx.amount) problemas.push(`semente ${seed}: delta de ${tipo} errado`);
      }
      if (com.transfers !== base.transfers + 1)
        problemas.push(`semente ${seed}: contagem de transferências`);
    }
    expect(problemas.slice(0, 5)).toEqual([]);
  });

  it('marcar um estorno (refund) SOBE expenses em exatamente o valor do estorno (ADR-0020 item 3)', () => {
    // A versão "nunca aumenta" vale só para despesas e compras: um estorno subtrai das despesas,
    // então marcá-lo como transferência tira essa subtração. Isto é o comportamento da ADR.
    const items = [item(tx(C, 'credit_card_purchase', -10000)), item(tx(C, 'refund', 3000))];
    const base = deDominio(spendingForPeriod(items, OUT));
    const marcado = deDominio(
      spendingForPeriod([items[0] as SpendingItem, item(tx(C, 'refund', 3000), true)], OUT),
    );
    expect(base.expenses).toBe(7000);
    expect(marcado.expenses).toBe(10000);
    expect(marcado.expenses - base.expenses).toBe(3000);
  });

  it('a ordem dos itens não muda o resultado (3 embaralhamentos por lote, 300 lotes)', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const rng = prng(seed * 11);
      const items = gerarLote(rng, DIAS);
      const { p } = periodoAleatorio(rng);
      const base = JSON.stringify(deDominio(spendingForPeriod(items, p)));
      for (let rep = 0; rep < 3; rep++) {
        const emb = [...items];
        for (let i = emb.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const tmp = emb[i] as SpendingItem;
          emb[i] = emb[j] as SpendingItem;
          emb[j] = tmp;
        }
        if (JSON.stringify(deDominio(spendingForPeriod(emb, p))) !== base)
          problemas.push(`semente ${seed}`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('linhas fora do período não mudam nenhum campo, mesmo sendo válidas e transferências', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 200; seed++) {
      const rng = prng(seed * 13);
      const dentro = gerarLote(rng, DIAS);
      const { p, i, j } = periodoAleatorio(rng);
      const fora = DIAS.filter((_, idx) => idx < i || idx > j);
      if (fora.length === 0) continue;
      const extra = Array.from({ length: 10 }, () => gerarItem(rng, fora));
      const base = JSON.stringify(deDominio(spendingForPeriod(dentro, p)));
      const com = JSON.stringify(deDominio(spendingForPeriod([...dentro, ...extra], p)));
      if (base !== com) problemas.push(`semente ${seed}`);
    }
    expect(problemas).toEqual([]);
  });

  it('a mesma entrada, repetida, dá o mesmo resultado (sem estado escondido)', () => {
    const items = gerarLote(prng(99), DIAS);
    const a = JSON.stringify(deDominio(spendingForPeriod(items, OUT)));
    const b = JSON.stringify(deDominio(spendingForPeriod(items, OUT)));
    expect(a).toBe(b);
  });
});

describe('QA T1.6 gastos: período inválido (decisão do dev aceita pelo CTO, coberta aqui)', () => {
  it('início depois do fim lança Error', () => {
    expect(() => spendingForPeriod([], { start: '2026-10-31', end: '2026-10-01' })).toThrow(Error);
  });

  it('data inválida no início ou no fim lança Error', () => {
    expect(() => spendingForPeriod([], { start: '2026-02-30', end: '2026-10-31' })).toThrow(Error);
    expect(() => spendingForPeriod([], { start: '2026-10-01', end: '2026-13-01' })).toThrow(Error);
    expect(() => spendingForPeriod([], { start: '', end: '2026-10-31' })).toThrow(Error);
    expect(() => spendingForPeriod([], { start: '2026-10-01', end: '2026-10-1' })).toThrow(Error);
  });

  it('período de um dia só (início igual ao fim) é válido e pega só aquele dia', () => {
    const items = [
      item(tx(S, 'expense', -100, '2026-10-05')),
      item(tx(S, 'expense', -200, '2026-10-06')),
    ];
    const r = spendingForPeriod(items, { start: '2026-10-05', end: '2026-10-05' });
    expect(Number(r.expenses)).toBe(100);
  });

  it('período que não traz nenhuma linha dá zero (não é erro)', () => {
    const r = spendingForPeriod([item(tx(S, 'expense', -100, '2026-10-05'))], {
      start: '2026-11-01',
      end: '2026-11-30',
    });
    expect(Number(r.expenses)).toBe(0);
  });

  it('linha inválida fora do período também lança (valida antes de filtrar)', () => {
    const invalida = item(tx(S, 'expense', 777, '2026-09-01'));
    expect(() => spendingForPeriod([invalida], OUT)).toThrow(Error);
  });

  it('refund com sinal negativo lança Error (sinal inválido)', () => {
    expect(() => spendingForPeriod([item(tx(C, 'refund', -3000))], OUT)).toThrow(Error);
  });

  it('o erro de período não ecoa a entrada', () => {
    let msg = '';
    try {
      spendingForPeriod([], { start: '2026-10-31', end: '2026-10-01' });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).not.toMatch(/\d/);
  });
});

describe('QA T1.6 gastos: credit_card_payment com sinal positivo', () => {
  it('pagamento positivo (entrada na conta do cartão) vai para cardPayments em módulo, não para despesa nem receita', () => {
    const r = spendingForPeriod([item(tx(C, 'credit_card_payment', 10000))], OUT);
    expect(Number(r.cardPayments)).toBe(10000);
    expect(Number(r.expenses)).toBe(0);
    expect(Number(r.income)).toBe(0);
    expect(Number(r.net)).toBe(0);
  });

  it('compra + pagamento positivo: a despesa conta uma vez, o pagamento não muda expenses', () => {
    const r = spendingForPeriod(
      [item(tx(C, 'credit_card_purchase', -10000)), item(tx(C, 'credit_card_payment', 10000))],
      OUT,
    );
    expect(Number(r.expenses)).toBe(10000);
    expect(Number(r.cardPayments)).toBe(10000);
    expect(Number(r.net)).toBe(-10000);
  });

  it('pagamento de zero não mexe em nada', () => {
    const r = spendingForPeriod([item(tx(C, 'credit_card_payment', 0))], OUT);
    expect(deDominio(r)).toEqual({
      expenses: 0,
      income: 0,
      net: 0,
      cardPayments: 0,
      investedOut: 0,
      investedIn: 0,
      transfers: 0,
      uCount: 0,
      uTotal: 0,
    });
  });
});

describe('QA T1.6 gastos: valores perto do inteiro seguro', () => {
  it('despesa de MAX centavos: expenses MAX e net -MAX', () => {
    const r = spendingForPeriod([item(tx(C, 'expense', -MAX))], OUT);
    expect(Number(r.expenses)).toBe(MAX);
    expect(Number(r.net)).toBe(-MAX);
  });

  it('estorno de MAX centavos sozinho: expenses -MAX e net MAX', () => {
    const r = spendingForPeriod([item(tx(C, 'refund', MAX))], OUT);
    expect(Number(r.expenses)).toBe(-MAX);
    expect(Number(r.net)).toBe(MAX);
  });

  it('despesa de MAX com estorno de MAX no mesmo mês: expenses zero', () => {
    const r = spendingForPeriod([item(tx(C, 'expense', -MAX)), item(tx(C, 'refund', MAX))], OUT);
    expect(Number(r.expenses)).toBe(0);
  });

  it('receita de MAX com despesa de MAX: net zero', () => {
    const r = spendingForPeriod([item(tx(S, 'income', MAX)), item(tx(C, 'expense', -MAX))], OUT);
    expect(Number(r.net)).toBe(0);
  });

  it('pagamento de fatura de -MAX vai para cardPayments como MAX', () => {
    const r = spendingForPeriod([item(tx(S, 'credit_card_payment', -MAX))], OUT);
    expect(Number(r.cardPayments)).toBe(MAX);
  });

  it('pagamento positivo de MAX vai para cardPayments como MAX', () => {
    const r = spendingForPeriod([item(tx(S, 'credit_card_payment', MAX))], OUT);
    expect(Number(r.cardPayments)).toBe(MAX);
  });

  it('o que estoura de verdade lança (out_of_range do money), e não dá resultado errado', () => {
    // -MAX e -1: a soma real é MAX + 1, fora da faixa. Tem de lançar, não dar número torto.
    expect(() =>
      spendingForPeriod([item(tx(C, 'expense', -MAX)), item(tx(C, 'expense', -1))], OUT),
    ).toThrow(Error);
  });

  it('a ordem [estorno, despesa MAX, despesa 1] dá o valor certo quando nenhuma soma parcial passa do limite', () => {
    const r = spendingForPeriod(
      [item(tx(C, 'refund', 2)), item(tx(C, 'expense', -MAX)), item(tx(C, 'expense', -1))],
      OUT,
    );
    expect(Number(r.expenses)).toBe(MAX - 1);
  });

  it.fails(
    'BUG-T1.6-01: mesma lista [despesa -MAX, despesa -1, estorno +2] dá o mesmo resultado em qualquer ordem',
    () => {
      // Soma real: MAX + 1 - 2 = MAX - 1 (cabe). Em ordem A,B,C a soma parcial MAX+1 passa do limite e lança.
      // Em ordem C,A,B dá MAX-1. "Ordem não importa" exige o mesmo resultado nas 6 ordens.
      const a = item(tx(C, 'expense', -MAX));
      const b = item(tx(C, 'expense', -1));
      const c = item(tx(C, 'refund', 2));
      const ordens = [
        [a, b, c],
        [a, c, b],
        [b, a, c],
        [b, c, a],
        [c, a, b],
        [c, b, a],
      ];
      const resultados = ordens.map((ordem) => {
        try {
          return String(Number(spendingForPeriod(ordem, OUT).expenses));
        } catch {
          return 'erro';
        }
      });
      expect(new Set(resultados).size).toBe(1);
    },
  );
});

describe('QA T1.6 gastos: sem mutação e tipos', () => {
  it('não muta lote, itens nem transações congeladas', () => {
    const items = Object.freeze(
      gerarLote(prng(4242), DIAS).map((i) =>
        Object.freeze({ tx: Object.freeze({ ...i.tx }), isTransfer: i.isTransfer }),
      ),
    );
    const antes = JSON.stringify(items);
    expect(() => spendingForPeriod(items, Object.freeze({ ...OUT }))).not.toThrow();
    expect(JSON.stringify(items)).toBe(antes);
  });

  it('a soma de todos os campos fica em Cents (inteiro, sem casa decimal)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = spendingForPeriod(gerarLote(prng(seed * 19), DIAS), OUT);
      for (const v of [
        r.expenses,
        r.income,
        r.net,
        r.cardPayments,
        r.investedOut,
        r.investedIn,
        r.unclassified.total,
      ]) {
        expect(Number.isInteger(Number(v))).toBe(true);
      }
    }
  });
});
