import { describe, expect, it } from 'vitest';
import {
  MoneyError,
  add,
  cents,
  formatBRL,
  fromDb,
  negate,
  parseBRL,
  sum,
  type Cents,
  type MoneyErrorCode,
} from '../../../domain/money';

const MAX = Number.MAX_SAFE_INTEGER;
const asCents = (n: number): Cents => n as Cents;

/** Confere o código do erro e que a mensagem não repete a entrada nem seus dígitos. */
function expectMoneyError(fn: () => unknown, code: MoneyErrorCode, input: unknown): void {
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(MoneyError);
  const err = caught as MoneyError;
  expect(err.code).toBe(code);
  expect(err.name).toBe('MoneyError');
  expect(err.message.length).toBeGreaterThan(0);
  const raw = typeof input === 'string' ? input : String(input);
  if (raw.trim() !== '') expect(err.message).not.toContain(raw.trim());
  for (const digits of raw.match(/\d+/g) ?? []) {
    expect(err.message).not.toContain(digits);
  }
}

describe('cents', () => {
  it.each([
    [1230, 1230],
    [-1230, -1230],
    [0, 0],
    [MAX, MAX],
    [-MAX, -MAX],
  ])('aceita o inteiro seguro %s', (entrada, esperado) => {
    expect(cents(entrada)).toBe(esperado);
  });

  it('-0 vira 0 (Object.is com 0)', () => {
    expect(Object.is(cents(-0), 0)).toBe(true);
  });

  it.each([1.5, NaN, Infinity, -Infinity])('recusa %s como not_integer', (entrada) => {
    expectMoneyError(() => cents(entrada), 'not_integer', entrada);
  });

  it('recusa 2 ** 53 como out_of_range', () => {
    expectMoneyError(() => cents(2 ** 53), 'out_of_range', 2 ** 53);
  });
});

describe('parseBRL: valores aceitos', () => {
  it.each([
    ['1.234,56', 123456],
    ['R$ 12,30', 1230],
    ['R$12,30', 1230],
    ['R$ 12,30', 1230],
    ['R$ 12,30', 1230],
    ['  R$ 12,30  ', 1230],
    [' R$ 12,30 ', 1230],
    ['-R$ 12,30', -1230],
    ['- R$ 12,30', -1230],
    ['R$ -12,30', -1230],
    ['+R$ 12,30', 1230],
    ['(12,30)', -1230],
    ['(R$ 12,30)', -1230],
    ['12', 1200],
    ['12,3', 1230],
    ['0,01', 1],
    ['0,5', 50],
    ['1234,56', 123456],
    ['1.234', 123400],
    ['12.345.678,90', 1234567890],
    ['90.071.992.547.409,91', 9007199254740991],
  ])('lê %j como %s centavos', (entrada, esperado) => {
    expect(parseBRL(entrada)).toBe(esperado);
  });

  it('"-0,00" vira 0 (Object.is com 0)', () => {
    const r = parseBRL('-0,00');
    expect(r).toBe(0);
    expect(Object.is(r, 0)).toBe(true);
  });
});

describe('parseBRL: valores recusados', () => {
  it('um centavo acima do teto é out_of_range', () => {
    const entrada = '90.071.992.547.409,92';
    expectMoneyError(() => parseBRL(entrada), 'out_of_range', entrada);
  });

  it.each(['1,234.56', 'R$ 1,234.56', '12,30.5'])(
    'formato americano %j é ambiguous_format',
    (entrada) => {
      expectMoneyError(() => parseBRL(entrada), 'ambiguous_format', entrada);
    },
  );

  it('"1.234.56" é invalid_format (sem vírgula e grupo final de 2 dígitos)', () => {
    expectMoneyError(() => parseBRL('1.234.56'), 'invalid_format', '1.234.56');
  });

  it.each(['', '   '])('entrada vazia %j é empty', (entrada) => {
    expectMoneyError(() => parseBRL(entrada), 'empty', entrada);
  });

  it.each([
    'abc',
    'R$',
    '12,345',
    ',50',
    '1.23',
    '1234.567,00',
    '12,',
    '--12',
    '-(12,30)',
    '12 30',
    '1e3',
  ])('%j é invalid_format', (entrada) => {
    expectMoneyError(() => parseBRL(entrada), 'invalid_format', entrada);
  });
});

describe('formatBRL', () => {
  it.each([
    [0, 'R$ 0,00'],
    [1, 'R$ 0,01'],
    [-1, '-R$ 0,01'],
    [1230, 'R$ 12,30'],
    [-1230, '-R$ 12,30'],
    [123456, 'R$ 1.234,56'],
    [123456789, 'R$ 1.234.567,89'],
    [MAX, 'R$ 90.071.992.547.409,91'],
  ])('formata %s como %j', (entrada, esperado) => {
    const saida = formatBRL(asCents(entrada));
    expect(saida).toBe(esperado);
    expect(saida.includes(' ') || saida.includes(' ')).toBe(false);
  });

  it('recusa valor não inteiro com not_integer', () => {
    expectMoneyError(() => formatBRL(1.5 as Cents), 'not_integer', 1.5);
  });

  it.each([0, 1, -1, 99, 100, 101, 123456, -123456, MAX, -MAX])('ida e volta preserva %s', (x) => {
    expect(parseBRL(formatBRL(asCents(x)))).toBe(x);
  });
});

describe('fromDb', () => {
  it.each([
    ['123456', 123456],
    [123456n, 123456],
    [123456, 123456],
    ['-1230', -1230],
    [-1230n, -1230],
    ['9007199254740991', MAX],
  ])('converte %s para %s', (entrada, esperado) => {
    expect(fromDb(entrada)).toBe(esperado);
  });

  it.each(['0', '-0', 0n])('zero vindo como %s é 0 (Object.is)', (entrada) => {
    expect(Object.is(fromDb(entrada), 0)).toBe(true);
  });

  it.each(['9007199254740993', 9007199254740993n, '-9007199254740993'])(
    'fora da faixa %s é out_of_range',
    (entrada) => {
      expectMoneyError(() => fromDb(entrada), 'out_of_range', entrada);
    },
  );

  it.each(['12.5', '1e3', '', ' 12', '12 ', 'abc', '0x10'])(
    'texto %j é invalid_format',
    (entrada) => {
      expectMoneyError(() => fromDb(entrada), 'invalid_format', entrada);
    },
  );

  it('number não inteiro (12.5) é not_integer', () => {
    expectMoneyError(() => fromDb(12.5), 'not_integer', 12.5);
  });
});

describe('add, sum e negate', () => {
  it('sum([10, 20]) é 30 (sem float)', () => {
    expect(sum([asCents(10), asCents(20)])).toBe(30);
  });

  it('sum([]) é 0', () => {
    expect(Object.is(sum([]), 0)).toBe(true);
  });

  it('somar 1 dez vezes dá 10', () => {
    expect(sum(Array.from({ length: 10 }, () => asCents(1)))).toBe(10);
  });

  it('entrada e saída iguais somam 0', () => {
    expect(sum([asCents(123456), asCents(-123456)])).toBe(0);
  });

  it('add(1230, -230) é 1000', () => {
    expect(add(asCents(1230), asCents(-230))).toBe(1000);
  });

  it('add acima do teto é out_of_range', () => {
    expectMoneyError(() => add(asCents(MAX), asCents(1)), 'out_of_range', MAX + 1);
  });

  it('sum checa a faixa a cada passo, não só no fim', () => {
    expectMoneyError(() => sum([asCents(MAX), asCents(1), asCents(-1)]), 'out_of_range', MAX + 1);
  });

  it('negate(1230) é -1230', () => {
    expect(negate(asCents(1230))).toBe(-1230);
  });

  it('negate(0) é 0 (Object.is)', () => {
    expect(Object.is(negate(asCents(0)), 0)).toBe(true);
  });

  it('negate(-MAX_SAFE) é MAX_SAFE', () => {
    expect(negate(asCents(-MAX))).toBe(MAX);
  });
});

describe('T1.1b: entrada que não é texto', () => {
  it.each([undefined, null, 12, {}])('parseBRL(%j) com cast é invalid_format', (entrada) => {
    expectMoneyError(() => parseBRL(entrada as never), 'invalid_format', entrada);
  });

  it.each([null, undefined, { toString: () => '12' }])(
    'fromDb com cast (%#) é invalid_format',
    (entrada) => {
      expectMoneyError(() => fromDb(entrada as never), 'invalid_format', entrada);
    },
  );
});

describe('T1.1b: add e sum validam os operandos', () => {
  it('add(0.5, 0.5) com cast é not_integer', () => {
    expectMoneyError(() => add(asCents(0.5), asCents(0.5)), 'not_integer', 0.5);
  });

  it.each([
    [null, 1],
    [true, 1],
  ])('add(%j, %j) com cast lança MoneyError', (a, b) => {
    expect(() => add(a as never, asCents(b))).toThrow(MoneyError);
  });

  it('add(2**60, -(2**60)) com cast é out_of_range', () => {
    expectMoneyError(() => add(asCents(2 ** 60), asCents(-(2 ** 60))), 'out_of_range', 2 ** 60);
  });

  it('sum(null) com cast lança MoneyError', () => {
    expect(() => sum(null as never)).toThrow(MoneyError);
  });
});

describe('T1.1b: parseBRL, caracterização de bordas recusadas', () => {
  it.each(['(-12,30)', '( 12,30 )', '-R$ -12'])('%j é invalid_format', (entrada) => {
    expectMoneyError(() => parseBRL(entrada), 'invalid_format', entrada);
  });
});
