import { describe, expect, it } from 'vitest';
import type { Cents } from '../../../domain/money';
import {
  validateTransaction,
  type NormalizedTransaction,
  type Problem,
  type ProblemCode,
  type TransactionType,
} from '../../../domain/transactions';

const asCents = (n: number): Cents => n as Cents;

const base: NormalizedTransaction = {
  source: 'manual',
  accountRef: 'conta-1',
  date: '2026-10-06',
  description: 'Padaria Exemplo',
  amount: asCents(-830),
  currency: 'BRL',
  type: 'expense',
  status: 'posted',
};

/** Cada caso muda só o que diz, em cima da base válida. */
function make(over: Record<string, unknown>): NormalizedTransaction {
  return { ...base, ...over };
}

function codes(t: NormalizedTransaction): ProblemCode[] {
  return validateTransaction(t).problems.map((p) => p.code);
}

function withType(type: TransactionType, amount: number): NormalizedTransaction {
  return make({ type, amount: asCents(amount) });
}

describe('validateTransaction: transação válida', () => {
  it('a base válida não tem problema e é ok', () => {
    expect(validateTransaction(base)).toEqual({ ok: true, problems: [] });
  });
});

describe('validateTransaction: sinal do valor por tipo', () => {
  it('despesa com valor positivo é sign_mismatch (erro no campo amount)', () => {
    const r = validateTransaction(withType('expense', 830));
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual<Problem[]>([
      { code: 'sign_mismatch', field: 'amount', severity: 'error' },
    ]);
  });

  it('compra no cartão com valor negativo é aceita', () => {
    expect(validateTransaction(withType('credit_card_purchase', -830))).toEqual({
      ok: true,
      problems: [],
    });
  });

  it('compra no cartão com valor positivo é sign_mismatch', () => {
    expect(codes(withType('credit_card_purchase', 830))).toEqual(['sign_mismatch']);
  });

  it('receita com valor positivo é aceita', () => {
    expect(validateTransaction(withType('income', 500000))).toEqual({ ok: true, problems: [] });
  });

  it('receita com valor negativo é sign_mismatch', () => {
    expect(codes(withType('income', -500000))).toEqual(['sign_mismatch']);
  });

  it('estorno com valor positivo é aceito', () => {
    expect(codes(withType('refund', 830))).toEqual([]);
  });

  it('estorno com valor negativo é sign_mismatch', () => {
    expect(codes(withType('refund', -830))).toEqual(['sign_mismatch']);
  });

  it.each([830, -830])('transferência aceita qualquer sinal (%i)', (amount) => {
    expect(validateTransaction(withType('transfer', amount))).toEqual({ ok: true, problems: [] });
  });

  it.each([830, -830])('investimento aceita qualquer sinal (%i)', (amount) => {
    expect(validateTransaction(withType('investment', amount))).toEqual({
      ok: true,
      problems: [],
    });
  });

  it('pagamento de fatura saindo da conta corrente (negativo) é aceito', () => {
    expect(codes(withType('credit_card_payment', -830))).toEqual([]);
  });

  it('pagamento de fatura entrando na conta do cartão (positivo) é aceito', () => {
    expect(codes(withType('credit_card_payment', 830))).toEqual([]);
  });

  it.each([830, -830])('tipo other aceita qualquer sinal (%i)', (amount) => {
    expect(validateTransaction(withType('other', amount))).toEqual({ ok: true, problems: [] });
  });
});

describe('validateTransaction: valor', () => {
  it('valor zero é só aviso zero_amount e não derruba ok nem gera sign_mismatch', () => {
    const r = validateTransaction(withType('expense', 0));
    expect(r.ok).toBe(true);
    expect(r.problems).toEqual<Problem[]>([
      { code: 'zero_amount', field: 'amount', severity: 'warning' },
    ]);
  });

  it('valor fracionário é invalid_amount (erro) e não gera sign_mismatch', () => {
    const r = validateTransaction(make({ amount: 12.5 }));
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual<Problem[]>([
      { code: 'invalid_amount', field: 'amount', severity: 'error' },
    ]);
  });

  it.each([NaN, Infinity, -Infinity, 2 ** 53, '830', null, undefined])(
    'valor que não é inteiro seguro (%s) é invalid_amount sem sign_mismatch',
    (amount) => {
      expect(codes(make({ type: 'income', amount }))).toEqual(['invalid_amount']);
    },
  );
});

describe('validateTransaction: data civil', () => {
  it('30 de fevereiro é invalid_date', () => {
    expect(codes(make({ date: '2026-02-30' }))).toEqual(['invalid_date']);
  });

  it('29 de fevereiro de ano não bissexto (2026) é invalid_date', () => {
    expect(codes(make({ date: '2026-02-29' }))).toEqual(['invalid_date']);
  });

  it('29 de fevereiro de ano bissexto (2028) é aceito', () => {
    expect(codes(make({ date: '2028-02-29' }))).toEqual([]);
  });

  it('1900 não é bissexto e 2000 é', () => {
    expect(codes(make({ date: '1900-02-29' }))).toEqual(['invalid_date']);
    expect(codes(make({ date: '2000-02-29' }))).toEqual([]);
  });

  it.each(['2026-13-01', '2026-00-10', '2026-1-05', '2026-10-06T00:00', ''])(
    'formato ou calendário inválido (%j) é invalid_date',
    (date) => {
      expect(codes(make({ date }))).toEqual(['invalid_date']);
    },
  );

  it('data que não é string é invalid_date', () => {
    expect(codes(make({ date: undefined }))).toEqual(['invalid_date']);
  });

  it('dia 31 em mês de 30 dias é invalid_date', () => {
    expect(codes(make({ date: '2026-04-31' }))).toEqual(['invalid_date']);
  });
});

describe('validateTransaction: hora', () => {
  it.each(['09:05', '23:59', '00:00'])('hora %s é aceita', (time) => {
    expect(codes(make({ time }))).toEqual([]);
  });

  it.each(['9:05', '24:00', '12:60'])('hora %s é invalid_time', (time) => {
    expect(codes(make({ time }))).toEqual(['invalid_time']);
  });

  it('hora presente mas que não é string é invalid_time', () => {
    expect(codes(make({ time: 905 }))).toEqual(['invalid_time']);
  });
});

describe('validateTransaction: data de lançamento (postedAt)', () => {
  it('data de lançamento válida é aceita', () => {
    expect(codes(make({ postedAt: '2026-10-07' }))).toEqual([]);
  });

  it('data de lançamento impossível é invalid_posted_at', () => {
    expect(codes(make({ postedAt: '2026-02-30' }))).toEqual(['invalid_posted_at']);
  });
});

describe('validateTransaction: campos de texto e enumerações', () => {
  it.each(['', '   '])('descrição vazia ou só espaços (%j) é erro empty_description', (d) => {
    const r = validateTransaction(make({ description: d }));
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual<Problem[]>([
      { code: 'empty_description', field: 'description', severity: 'error' },
    ]);
  });

  it('conta vazia é empty_account_ref', () => {
    expect(codes(make({ accountRef: '' }))).toEqual(['empty_account_ref']);
  });

  it('moeda diferente de BRL é invalid_currency', () => {
    expect(codes(make({ currency: 'USD' }))).toEqual(['invalid_currency']);
  });

  it('tipo desconhecido é invalid_type e não gera sign_mismatch', () => {
    expect(codes(make({ type: 'gasto' }))).toEqual(['invalid_type']);
  });

  it('status desconhecido é invalid_status', () => {
    expect(codes(make({ status: 'done' }))).toEqual(['invalid_status']);
  });

  it('fonte desconhecida é invalid_source', () => {
    expect(codes(make({ source: 'csv' }))).toEqual(['invalid_source']);
  });
});

describe('validateTransaction: vários problemas e ordem', () => {
  it('devolve todos os problemas na ordem dos campos do contrato', () => {
    const t = make({
      type: 'expense',
      amount: asCents(830),
      date: '2026-02-30',
      description: '  ',
    });
    expect(codes(t)).toEqual(['invalid_date', 'empty_description', 'sign_mismatch']);
  });

  it('todos os campos inválidos saem na ordem fixa do contrato', () => {
    const t = make({
      source: 'csv',
      accountRef: '',
      date: 'x',
      time: 'x',
      postedAt: 'x',
      description: '',
      amount: 1.5,
      currency: 'USD',
      type: 'gasto',
      status: 'done',
    });
    const r = validateTransaction(t);
    expect(r.problems.map((p) => p.field)).toEqual([
      'source',
      'accountRef',
      'date',
      'time',
      'postedAt',
      'description',
      'amount',
      'currency',
      'type',
      'status',
    ]);
    expect(r.ok).toBe(false);
  });

  it('aviso sozinho não derruba ok, mas aviso junto com erro deixa ok falso', () => {
    expect(validateTransaction(withType('income', 0)).ok).toBe(true);
    expect(validateTransaction(make({ amount: asCents(0), description: '' })).ok).toBe(false);
  });
});

describe('validateTransaction: pureza', () => {
  it('não muta a entrada congelada e não lança', () => {
    const frozen = Object.freeze({ ...base, amount: asCents(830), date: '2026-02-30' });
    expect(() => validateTransaction(frozen)).not.toThrow();
    expect(frozen).toEqual({ ...base, amount: 830, date: '2026-02-30' });
  });

  it('problemas têm só código, campo e severidade (sem descrição nem valores)', () => {
    const r = validateTransaction(make({ description: '', amount: asCents(830) }));
    expect(r.problems.length).toBeGreaterThan(0);
    for (const p of r.problems) {
      expect(Object.keys(p).sort()).toEqual(['code', 'field', 'severity']);
    }
    expect(JSON.stringify(r)).not.toContain('830');
  });

  it('é determinística: mesma entrada, mesmo resultado', () => {
    expect(validateTransaction(base)).toEqual(validateTransaction(base));
  });
});

describe('validateTransaction: entrada que não é objeto (T1.2b)', () => {
  const emptyProblems = validateTransaction({} as NormalizedTransaction);

  it('a referência ({}) tem problemas dos campos obrigatórios e não é ok', () => {
    expect(emptyProblems.ok).toBe(false);
    expect(emptyProblems.problems.length).toBeGreaterThan(0);
  });

  it.each<[string, unknown]>([
    ['null', null],
    ['undefined', undefined],
    ['texto', 'x'],
    ['número', 12],
  ])('%s não lança e dá os mesmos problemas de {}, na mesma ordem', (_nome, entrada) => {
    expect(() => validateTransaction(entrada as NormalizedTransaction)).not.toThrow();
    const r = validateTransaction(entrada as NormalizedTransaction);
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual(emptyProblems.problems);
  });

  it('array e boolean também não lançam e dão ok falso', () => {
    for (const entrada of [[], [1, 2], true, false]) {
      const r = validateTransaction(entrada as unknown as NormalizedTransaction);
      expect(r.ok).toBe(false);
      expect(r.problems).toEqual(emptyProblems.problems);
    }
  });

  it('array com os campos de uma transação válida pendurados dá os mesmos problemas de {}', () => {
    const entrada = Object.assign([], {
      source: 'manual',
      accountRef: 'conta-1',
      date: '2026-10-06',
      description: 'Padaria Exemplo',
      amount: -830,
      currency: 'BRL',
      type: 'expense',
      status: 'posted',
    });
    expect(() => validateTransaction(entrada as unknown as NormalizedTransaction)).not.toThrow();
    const r = validateTransaction(entrada as unknown as NormalizedTransaction);
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual(emptyProblems.problems);
  });
});

describe('validateTransaction: proteção de comportamento existente (T1.2b)', () => {
  it('data com dígitos não ASCII é invalid_date', () => {
    expect(codes(make({ date: '٢٠٢٦-١٠-٠٦' }))).toEqual(['invalid_date']);
    expect(codes(make({ date: '２０２６-10-06' }))).toEqual(['invalid_date']);
  });

  it('quebra de linha no fim da data ou da hora é rejeitada', () => {
    expect(codes(make({ date: '2026-10-06\n' }))).toEqual(['invalid_date']);
    expect(codes(make({ time: '10:30\n' }))).toEqual(['invalid_time']);
  });

  it('ano 0000 é invalid_date', () => {
    expect(codes(make({ date: '0000-10-06' }))).toEqual(['invalid_date']);
  });

  it('accountRef só com espaços é empty_account_ref', () => {
    expect(codes(make({ accountRef: '   ' }))).toEqual(['empty_account_ref']);
  });

  it('postedAt e time que não são texto são invalid_posted_at e invalid_time', () => {
    expect(codes(make({ postedAt: 20261006 }))).toEqual(['invalid_posted_at']);
    expect(codes(make({ time: 1030 }))).toEqual(['invalid_time']);
  });
});
