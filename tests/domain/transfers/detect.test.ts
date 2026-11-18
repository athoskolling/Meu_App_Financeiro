import { describe, expect, it } from 'vitest';
import type { Cents } from '../../../domain/money';
import { detectTransfers, type TransferMatch } from '../../../domain/transfers';
import type { NormalizedTransaction, TransactionType } from '../../../domain/transactions';

const S = 'santander';
const N = 'nubank';
const C = 'cartao';
const OTHER = 'banco-c';

function t(
  accountRef: string,
  type: TransactionType,
  amount: number,
  date = '2026-10-06',
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
  };
}

const opts = { windowDays: 2 };

describe('detectTransfers', () => {
  it('par simples', () => {
    const r = detectTransfers([t(S, 'transfer', -100000), t(N, 'transfer', 100000)], opts);
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 0, confidence: 'high' }]);
  });

  it('1 dia de diferença ainda é high', () => {
    const r = detectTransfers(
      [t(S, 'transfer', -100000, '2026-10-06'), t(N, 'transfer', 100000, '2026-10-07')],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 1, confidence: 'high' }]);
  });

  it('no limite da janela casa, com confiança medium', () => {
    const r = detectTransfers(
      [t(S, 'transfer', -100000, '2026-10-06'), t(N, 'transfer', 100000, '2026-10-08')],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 2, confidence: 'medium' }]);
  });

  it('fora da janela não casa', () => {
    expect(
      detectTransfers(
        [t(S, 'transfer', -100000, '2026-10-06'), t(N, 'transfer', 100000, '2026-10-09')],
        opts,
      ),
    ).toEqual([]);
  });

  it('5 dias com windowDays 2 não casa', () => {
    expect(
      detectTransfers(
        [t(S, 'transfer', -100000, '2026-10-06'), t(N, 'transfer', 100000, '2026-10-11')],
        opts,
      ),
    ).toEqual([]);
  });

  it('entrada antes da saída casa, daysApart é sempre >= 0', () => {
    const r = detectTransfers(
      [t(S, 'transfer', -100000, '2026-10-07'), t(N, 'transfer', 100000, '2026-10-06')],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 1, confidence: 'high' }]);
  });

  it('dois pares iguais: cada índice aparece uma vez só', () => {
    const r = detectTransfers(
      [
        t(S, 'transfer', -10000),
        t(S, 'transfer', -10000),
        t(N, 'transfer', 10000),
        t(N, 'transfer', 10000),
      ],
      opts,
    );
    expect(r).toHaveLength(2);
    expect(r.map((m) => m.outflowIndex).sort()).toEqual([0, 1]);
    expect(r.map((m) => m.inflowIndex).sort()).toEqual([2, 3]);
  });

  it('mesma conta não casa', () => {
    expect(detectTransfers([t(S, 'transfer', -10000), t(S, 'transfer', 10000)], opts)).toEqual([]);
  });

  it('saída sem par', () => {
    expect(detectTransfers([t(S, 'transfer', -10000)], opts)).toEqual([]);
  });

  it('compra no cartão não casa', () => {
    expect(
      detectTransfers([t(C, 'credit_card_purchase', -10000), t(N, 'transfer', 10000)], opts),
    ).toEqual([]);
  });

  it('investment, refund e credit_card_payment não casam com um transfer oposto', () => {
    const cases: [TransactionType, number][] = [
      ['investment', -10000],
      ['refund', 10000],
      ['credit_card_payment', -10000],
    ];
    for (const [type, amount] of cases) {
      const other = t(N, 'transfer', -amount);
      expect(detectTransfers([t(S, type, amount), other], opts)).toEqual([]);
      expect(detectTransfers([other, t(S, type, amount)], opts)).toEqual([]);
    }
  });

  it('valores diferentes não casam', () => {
    expect(detectTransfers([t(S, 'transfer', -100000), t(N, 'transfer', 99999)], opts)).toEqual(
      [],
    );
  });

  it('valor zero não casa', () => {
    expect(detectTransfers([t(S, 'transfer', 0), t(N, 'transfer', 0)], opts)).toEqual([]);
  });

  it('expense com income casa, com confiança medium', () => {
    const r = detectTransfers([t(S, 'expense', -10000), t(N, 'income', 10000)], opts);
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 0, confidence: 'medium' }]);
  });

  it('desempate por dias: vence a entrada mais próxima', () => {
    const r = detectTransfers(
      [
        t(S, 'transfer', -10000, '2026-10-01'),
        t(N, 'transfer', 10000, '2026-10-02'),
        t(N, 'transfer', 10000, '2026-10-01'),
      ],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 2, daysApart: 0, confidence: 'high' }]);
  });

  it('desempate por data da saída', () => {
    const r = detectTransfers(
      [
        t(S, 'transfer', -10000, '2026-10-03'),
        t(S, 'transfer', -10000, '2026-10-01'),
        t(N, 'transfer', 10000, '2026-10-02'),
      ],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 1, inflowIndex: 2, daysApart: 1, confidence: 'high' }]);
  });

  describe('determinismo', () => {
    const twoEqual = [
      t(S, 'transfer', -10000),
      t(S, 'transfer', -10000),
      t(N, 'transfer', 10000),
      t(N, 'transfer', 10000),
    ];
    const byDays = [
      t(S, 'transfer', -10000, '2026-10-01'),
      t(N, 'transfer', 10000, '2026-10-02'),
      t(N, 'transfer', 10000, '2026-10-01'),
    ];
    const permutations: number[][][] = [
      [
        [3, 2, 1, 0],
        [1, 3, 0, 2],
        [2, 0, 3, 1],
      ],
      [
        [2, 1, 0],
        [1, 0, 2],
        [0, 2, 1],
      ],
    ];

    function asObjects(txs: readonly NormalizedTransaction[]): string[] {
      return detectTransfers(txs, opts)
        .map((m: TransferMatch) =>
          JSON.stringify([txs[m.outflowIndex], txs[m.inflowIndex], m.daysApart, m.confidence]),
        )
        .sort();
    }

    it.each([
      ['dois pares iguais', twoEqual, permutations[0] ?? []],
      ['desempate por dias', byDays, permutations[1] ?? []],
    ])('%s: embaralhado dá os mesmos pares', (_name, base, perms) => {
      const reference = asObjects(base);
      for (const perm of perms) {
        expect(asObjects(perm.map((i) => base[i] as NormalizedTransaction))).toEqual(reference);
      }
    });
  });

  it('três contas: vence a entrada de texto canônico menor (regra 11 da ADR-0020)', () => {
    // Empate em dias e datas; o texto canônico da entrada começa por
    // ["manual","banco-c",...] contra ["manual","nubank",...]; "banco-c" < "nubank",
    // então a entrada de índice 2 vence e o índice 1 fica sem par.
    const r = detectTransfers(
      [t(S, 'transfer', -10000), t(N, 'transfer', 10000), t(OTHER, 'transfer', 10000)],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 2, daysApart: 0, confidence: 'high' }]);
  });

  it('virada de mês', () => {
    const r = detectTransfers(
      [t(S, 'transfer', -10000, '2026-10-31'), t(N, 'transfer', 10000, '2026-11-01')],
      opts,
    );
    expect(r).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 1, confidence: 'high' }]);
  });

  it('saída ordenada por outflowIndex', () => {
    const r = detectTransfers(
      [
        t(N, 'transfer', 5000),
        t(S, 'transfer', -7000),
        t(S, 'transfer', -5000),
        t(N, 'transfer', 7000),
      ],
      opts,
    );
    expect(r.map((m) => m.outflowIndex)).toEqual([1, 2]);
  });

  it('windowDays inválido lança Error', () => {
    for (const windowDays of [-1, 1.5, Number.NaN]) {
      expect(() => detectTransfers([], { windowDays })).toThrow(Error);
    }
  });

  it('não muta entrada congelada', () => {
    const txs = Object.freeze([
      Object.freeze(t(S, 'transfer', -10000)),
      Object.freeze(t(N, 'transfer', 10000)),
    ]);
    expect(() => detectTransfers(txs, Object.freeze({ windowDays: 2 }))).not.toThrow();
  });
});
