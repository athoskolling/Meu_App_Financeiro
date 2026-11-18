import { describe, expect, it } from 'vitest';
import { monthPeriod } from '../../../domain/dates';
import type { Cents } from '../../../domain/money';
import { spendingForPeriod, type SpendingItem } from '../../../domain/reports';
import type { NormalizedTransaction, TransactionType } from '../../../domain/transactions';

const S = 'santander';
const N = 'nubank';
const C = 'cartao';

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

const OUT = monthPeriod('2026-10');

const ZERO = {
  expenses: 0,
  income: 0,
  net: 0,
  cardPayments: 0,
  investedOut: 0,
  investedIn: 0,
  transfers: { count: 0 },
  unclassified: { count: 0, total: 0 },
};

function expected(over: Record<string, unknown>): unknown {
  return { ...ZERO, ...over };
}

describe('spendingForPeriod', () => {
  it('lista vazia: tudo zero', () => {
    expect(spendingForPeriod([], OUT)).toEqual(ZERO);
  });

  it('compra no cartão + pagamento da fatura: a despesa conta uma vez só', () => {
    const r = spendingForPeriod(
      [
        item(tx(C, 'credit_card_purchase', -10000, '2026-10-01')),
        item(tx(S, 'credit_card_payment', -10000, '2026-10-10')),
      ],
      OUT,
    );
    expect(r).toEqual(expected({ expenses: 10000, cardPayments: 10000, net: -10000 }));
  });

  it('pagamento parcial da fatura', () => {
    const r = spendingForPeriod(
      [item(tx(C, 'credit_card_purchase', -10000)), item(tx(S, 'credit_card_payment', -5000))],
      OUT,
    );
    expect(r).toEqual(expected({ expenses: 10000, cardPayments: 5000, net: -10000 }));
  });

  it('pagamento a maior nunca vira despesa', () => {
    const r = spendingForPeriod(
      [item(tx(C, 'credit_card_purchase', -10000)), item(tx(S, 'credit_card_payment', -15000))],
      OUT,
    );
    expect(r).toEqual(expected({ expenses: 10000, cardPayments: 15000, net: -10000 }));
  });

  it('estorno no mês subtrai das despesas', () => {
    const r = spendingForPeriod(
      [item(tx(C, 'credit_card_purchase', -10000)), item(tx(C, 'refund', 3000))],
      OUT,
    );
    expect(r).toEqual(expected({ expenses: 7000, net: -7000 }));
  });

  it('estorno maior que as compras deixa expenses negativo (sem corte em zero)', () => {
    const r = spendingForPeriod([item(tx(C, 'refund', 3000))], OUT);
    expect(r).toEqual(expected({ expenses: -3000, net: 3000 }));
  });

  it('compra em setembro e pagamento em outubro: cada mês fica com o seu', () => {
    const items = [
      item(tx(C, 'credit_card_purchase', -10000, '2026-09-20')),
      item(tx(S, 'credit_card_payment', -10000, '2026-10-10')),
    ];
    expect(spendingForPeriod(items, OUT)).toEqual(expected({ expenses: 0, cardPayments: 10000 }));
    expect(spendingForPeriod(items, monthPeriod('2026-09'))).toEqual(
      expected({ expenses: 10000, net: -10000 }),
    );
  });

  it('transferência casada fica fora de tudo e conta em transfers', () => {
    const r = spendingForPeriod(
      [item(tx(S, 'transfer', -100000), true), item(tx(N, 'transfer', 100000), true)],
      OUT,
    );
    expect(r).toEqual(expected({ transfers: { count: 2 } }));
  });

  it('isTransfer vence o tipo', () => {
    const r = spendingForPeriod([item(tx(S, 'expense', -5000), true)], OUT);
    expect(r).toEqual(expected({ expenses: 0, transfers: { count: 1 } }));
  });

  it('caixinha (investment) nunca é gasto nem receita', () => {
    const r = spendingForPeriod(
      [item(tx(N, 'investment', -40000)), item(tx(N, 'investment', 40000))],
      OUT,
    );
    expect(r).toEqual(expected({ investedOut: 40000, investedIn: 40000 }));
  });

  it('parcelado em 3x: cada parcela cai no mês da sua data', () => {
    const items = [
      item(tx(C, 'credit_card_purchase', -3000, '2026-10-05')),
      item(tx(C, 'credit_card_purchase', -3000, '2026-11-05')),
      item(tx(C, 'credit_card_purchase', -3000, '2026-12-05')),
    ];
    for (const month of ['2026-10', '2026-11', '2026-12']) {
      expect(spendingForPeriod(items, monthPeriod(month))).toEqual(
        expected({ expenses: 3000, net: -3000 }),
      );
    }
  });

  it('pending entra nas despesas', () => {
    const r = spendingForPeriod(
      [item(tx(C, 'credit_card_purchase', -2500, '2026-10-30', { status: 'pending' }))],
      OUT,
    );
    expect(r).toEqual(expected({ expenses: 2500, net: -2500 }));
  });

  it('bordas do período: início e fim inclusos, dias vizinhos fora', () => {
    const r = spendingForPeriod(
      ['2026-09-30', '2026-10-01', '2026-10-31', '2026-11-01'].map((d) =>
        item(tx(S, 'expense', -100, d)),
      ),
      OUT,
    );
    expect(r).toEqual(expected({ expenses: 200, net: -200 }));
  });

  it('receita', () => {
    const r = spendingForPeriod([item(tx(S, 'income', 500000))], OUT);
    expect(r).toEqual(expected({ income: 500000, net: 500000 }));
  });

  it('transferência sem par vai para unclassified, não para despesa', () => {
    const r = spendingForPeriod([item(tx(S, 'transfer', -20000), false)], OUT);
    expect(r).toEqual(expected({ unclassified: { count: 1, total: -20000 } }));
  });

  it('other vai para unclassified com soma com sinal', () => {
    const r = spendingForPeriod([item(tx(S, 'other', 700)), item(tx(S, 'other', -200))], OUT);
    expect(r).toEqual(expected({ unclassified: { count: 2, total: 500 } }));
  });

  const MIX: SpendingItem[] = [
    item(tx(C, 'credit_card_purchase', -10000)),
    item(tx(S, 'credit_card_payment', -10000)),
    item(tx(C, 'refund', 1000)),
    item(tx(S, 'income', 500000)),
    item(tx(N, 'investment', -40000)),
  ];
  const MIX_EXPECTED = expected({
    expenses: 9000,
    income: 500000,
    net: 491000,
    cardPayments: 10000,
    investedOut: 40000,
  });

  it('mistura completa', () => {
    expect(spendingForPeriod(MIX, OUT)).toEqual(MIX_EXPECTED);
  });

  it('a ordem dos itens não importa', () => {
    expect(spendingForPeriod([...MIX].reverse(), OUT)).toEqual(MIX_EXPECTED);
  });

  it('linha inválida (sinal errado) lança Error sem ecoar valores', () => {
    const run = (): unknown => spendingForPeriod([item(tx(S, 'expense', 777))], OUT);
    expect(run).toThrow(Error);
    expect(run).toThrow(/^(?!.*777)/);
  });

  it('não muta entrada congelada e dá o mesmo resultado', () => {
    const frozen = Object.freeze(
      MIX.map((i) => Object.freeze({ tx: Object.freeze({ ...i.tx }), isTransfer: i.isTransfer })),
    );
    const period = Object.freeze({ ...OUT });
    expect(() => spendingForPeriod(frozen, period)).not.toThrow();
    expect(spendingForPeriod(frozen, period)).toEqual(MIX_EXPECTED);
  });
});
