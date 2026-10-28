// QA independente da T1.1 (Money). Dados sintéticos apenas.
// Sem fast-check (não é dependência do projeto): gerador determinístico (mulberry32, semente fixa)
// e referências em BigInt, que são exatas para inteiros.
//
// Histórico: BUG-1 e BUG-2 foram corrigidos na T1.1b e agora são `it` (asserção direta).
// Achado novo (BUG-4, negate sem validação) segue como `it.fails`: o teste descreve o comportamento
// ESPERADO e falha hoje, então o suite segue verde. Quando for corrigido, o teste passa a falhar:
// nesse momento, troque `it.fails` por `it`.
// Desde a T1.1b há uma seção de ataque a tipos estranhos (add, sum, parseBRL, fromDb, formatBRL, cents).
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
} from '../../domain/money';

const MAX = Number.MAX_SAFE_INTEGER;
const MAX_BIG = BigInt(MAX);
const NBSP = ' ';
const NNBSP = ' ';
const CODES: readonly MoneyErrorCode[] = [
  'empty',
  'invalid_format',
  'ambiguous_format',
  'out_of_range',
  'not_integer',
];
const EDGE: readonly bigint[] = [
  0n,
  1n,
  -1n,
  9n,
  10n,
  -10n,
  11n,
  99n,
  100n,
  101n,
  -101n,
  999n,
  1000n,
  99999n,
  100000n,
  123456n,
  -123456n,
  999999999n,
  1000000000n,
  2n ** 52n,
  2n ** 52n + 1n,
  MAX_BIG,
  -MAX_BIG,
  MAX_BIG - 1n,
  -(MAX_BIG - 1n),
];

const asCents = (n: number): Cents => n as Cents;
const asCentsBig = (n: bigint): Cents => Number(n) as Cents;

/** mulberry32: gerador determinístico, mesma sequência a cada execução. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('lista vazia no gerador');
  return item;
}

/** Inteiro não negativo com até `maxDigits` dígitos (tamanho sorteado). */
function randomBig(rng: () => number, maxDigits: number): bigint {
  const len = 1 + Math.floor(rng() * maxDigits);
  let digits = '';
  for (let i = 0; i < len; i += 1) digits += String(Math.floor(rng() * 10));
  return BigInt(digits);
}

/** Valor na faixa segura, de qualquer magnitude, com sinal. */
function randomSafe(rng: () => number): bigint {
  const magnitude = randomBig(rng, 16) % (MAX_BIG + 1n);
  return rng() < 0.5 ? -magnitude : magnitude;
}

/** Referência independente: formata em BigInt, sem Number. */
function refFormat(n: bigint): string {
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}R$ ${whole},${frac}`;
}

/** Corpo "1.234,5" / "1234" / "12" com variações válidas da gramática. */
function brBody(abs: bigint, rng: () => number): string {
  const whole = abs / 100n;
  const frac = abs % 100n;
  const wholeText =
    rng() < 0.5 ? whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : whole.toString();
  if (frac === 0n && rng() < 0.5) return wholeText;
  if (frac % 10n === 0n && rng() < 0.5) return `${wholeText},${(frac / 10n).toString()}`;
  return `${wholeText},${frac.toString().padStart(2, '0')}`;
}

/** Texto em BRL válido para `value`, com sinal, parênteses, R$, espaços e separadores sorteados. */
function brText(value: bigint, rng: () => number): string {
  const abs = value < 0n ? -value : value;
  const body = brBody(abs, rng);
  const sep = (): string => pick(rng, ['', ' ', NBSP, NNBSP]);
  let core: string;
  if (value <= 0n && rng() < 0.2) {
    core = `(${rng() < 0.5 ? `R$${sep()}` : ''}${body})`;
  } else {
    const sign = value < 0n ? '-' : value > 0n ? pick(rng, ['', '+']) : pick(rng, ['', '', '-']);
    if (rng() < 0.3) {
      core = `${sign}${sign ? sep() : ''}${body}`;
    } else if (rng() < 0.5) {
      core = `${sign}${sign ? sep() : ''}R$${sep()}${body}`;
    } else {
      core = `R$${sep()}${sign}${sign ? sep() : ''}${body}`;
    }
  }
  return `${pick(rng, ['', ' ', NBSP, NNBSP, '  '])}${core}${pick(rng, ['', ' ', NBSP, NNBSP])}`;
}

/** Executa e devolve o erro lançado (ou undefined se não lançou). */
function captured(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return undefined;
}

/** Confere que `fn` lança MoneyError com o `code` e que a mensagem não tem dígitos. */
function expectCode(fn: () => unknown, code: MoneyErrorCode): void {
  const e = captured(fn);
  expect(e).toBeInstanceOf(MoneyError);
  expect((e as MoneyError).code).toBe(code);
  expect((e as MoneyError).message).not.toMatch(/\d/);
}

describe('propriedade: formatBRL segue o padrão e decodifica para o mesmo valor', () => {
  it('saída bate com a referência, casa com a regex e tem só ASCII + espaço comum', () => {
    const rng = mulberry32(1001);
    const values: bigint[] = [...EDGE];
    for (let i = 0; i < 5000; i += 1) values.push(randomSafe(rng));
    for (const n of values) {
      const text = formatBRL(asCentsBig(n));
      expect(text, `valor ${String(n)}`).toBe(refFormat(n));
      expect(text).toMatch(/^-?R\$ \d{1,3}(\.\d{3})*,\d{2}$/);
      expect(
        text.includes(String.fromCharCode(0xa0)) || text.includes(String.fromCharCode(0x202f)),
      ).toBe(false);
      expect(BigInt(text.replace(/\D/g, ''))).toBe(n < 0n ? -n : n);
    }
  });

  it('parseBRL(formatBRL(x)) === x para EDGE e 5000 valores aleatórios', () => {
    const rng = mulberry32(2002);
    const values: bigint[] = [...EDGE];
    for (let i = 0; i < 5000; i += 1) values.push(randomSafe(rng));
    for (const n of values) {
      expect(parseBRL(formatBRL(asCentsBig(n))), `valor ${String(n)}`).toBe(Number(n));
    }
  });

  it('ida e volta exaustiva de -1000 a 1000 centavos', () => {
    const bad: number[] = [];
    for (let n = -1000; n <= 1000; n += 1) {
      if (parseBRL(formatBRL(asCents(n))) !== n) bad.push(n);
    }
    expect(bad).toEqual([]);
  });
});

describe('propriedade: parseBRL aceita todas as variações válidas', () => {
  it('5000 valores aleatórios (e EDGE) escritos de formas diferentes lêem o valor exato', () => {
    const rng = mulberry32(3003);
    const values: bigint[] = [...EDGE];
    for (let i = 0; i < 5000; i += 1) values.push(randomSafe(rng));
    for (const n of values) {
      const text = brText(n, rng);
      expect(parseBRL(text), `entrada ${JSON.stringify(text)}`).toBe(Number(n));
    }
  });

  it('conversão por dígitos: todas as combinações de 0 a 999 reais com 2 casas', () => {
    const bad: string[] = [];
    for (let w = 0; w <= 999; w += 1) {
      for (let f = 0; f <= 99; f += 1) {
        const text = `${w},${String(f).padStart(2, '0')}`;
        if (parseBRL(text) !== w * 100 + f) bad.push(text);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('propriedade: fuzz de entrada malformada (parseBRL)', () => {
  const ALPHABET = [
    '0',
    '1',
    '7',
    '9',
    '.',
    ',',
    'R',
    '$',
    ' ',
    NBSP,
    NNBSP,
    '-',
    '+',
    '(',
    ')',
    'a',
    'e',
    '\t',
    '​',
    '١',
  ];

  it('30000 entradas: ou devolve Cents seguro coerente com o sinal, ou MoneyError com código e sem dígitos', () => {
    const rng = mulberry32(4242);
    const problems: string[] = [];
    for (let i = 0; i < 30000; i += 1) {
      const len = Math.floor(rng() * 11);
      let s = '';
      for (let j = 0; j < len; j += 1) s += pick(rng, ALPHABET);
      try {
        const r = parseBRL(s);
        const safe = Number.isSafeInteger(r) && !Object.is(r, -0);
        const hasDigit = /\d/.test(s);
        const signOk = r > 0 ? !/[-(]/.test(s) : r < 0 ? /[-(]/.test(s) : true;
        const stable = parseBRL(formatBRL(r)) === r;
        if (!safe || !hasDigit || !signOk || !stable) problems.push(`aceitou ${JSON.stringify(s)}`);
      } catch (e) {
        if (!(e instanceof MoneyError) || !CODES.includes(e.code) || /\d/.test(e.message)) {
          problems.push(`erro ${JSON.stringify(s)}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('fromDb: 20000 entradas aceitas são texto inteiro exato e dentro da faixa', () => {
    const rng = mulberry32(5150);
    const alphabet = ['0', '1', '9', '-', '+', ' ', '.', 'e', 'x', '\n', NBSP];
    const problems: string[] = [];
    for (let i = 0; i < 20000; i += 1) {
      const len = Math.floor(rng() * 9);
      let s = '';
      for (let j = 0; j < len; j += 1) s += pick(rng, alphabet);
      try {
        const r = fromDb(s);
        if (!/^-?\d+$/.test(s) || BigInt(s).toString() !== String(r) || !Number.isSafeInteger(r)) {
          problems.push(`aceitou ${JSON.stringify(s)}`);
        }
      } catch (e) {
        if (!(e instanceof MoneyError) || !CODES.includes(e.code))
          problems.push(`erro ${JSON.stringify(s)}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('faixa segura: tudo acima de MAX_SAFE_INTEGER é out_of_range', () => {
  it('2000 valores aleatórios grandes, em todas as portas de entrada', () => {
    const rng = mulberry32(777);
    for (let i = 0; i < 2000; i += 1) {
      const k = MAX_BIG + 1n + randomBig(rng, 30);
      const negK = -k;
      expectCode(() => fromDb(k.toString()), 'out_of_range');
      expectCode(() => fromDb(negK.toString()), 'out_of_range');
      expectCode(() => fromDb(k), 'out_of_range');
      expectCode(() => fromDb(negK), 'out_of_range');
      expectCode(() => fromDb(Number(k)), 'out_of_range');
      expectCode(() => parseBRL(refFormat(k)), 'out_of_range');
      expectCode(() => parseBRL(refFormat(negK)), 'out_of_range');
      // Zeros à esquerda com dígitos crus (sem agrupamento) não mudam a faixa.
      expectCode(
        () => parseBRL(`${'0'.repeat(20)}${k / 100n},${String(k % 100n).padStart(2, '0')}`),
        'out_of_range',
      );
    }
  });

  it('a fronteira exata: MAX aceito, MAX+1 recusado, nos dois sinais e com zeros à esquerda', () => {
    expect(parseBRL(refFormat(MAX_BIG))).toBe(MAX);
    expect(parseBRL(refFormat(-MAX_BIG))).toBe(-MAX);
    expect(parseBRL('0'.repeat(20) + '90071992547409,91')).toBe(MAX);
    expectCode(() => parseBRL(refFormat(MAX_BIG + 1n)), 'out_of_range');
    expectCode(() => parseBRL(refFormat(-MAX_BIG - 1n)), 'out_of_range');
    expectCode(() => parseBRL('0'.repeat(20) + '90071992547409,92'), 'out_of_range');
  });

  it('cents e formatBRL: não inteiro e fora da faixa têm códigos distintos', () => {
    const rng = mulberry32(88);
    for (let i = 0; i < 1000; i += 1) {
      const frac = rng() * 1e6 + 0.5;
      expectCode(() => cents(frac), 'not_integer');
      expectCode(() => formatBRL(frac as Cents), 'not_integer');
    }
    expectCode(() => cents(2 ** 53), 'out_of_range');
    expectCode(() => cents(-(2 ** 53)), 'out_of_range');
    expectCode(() => cents(1e21), 'out_of_range');
    expectCode(() => formatBRL((2 ** 53) as Cents), 'out_of_range');
  });
});

describe('propriedade: aritmética exata, sem float, com checagem a cada passo', () => {
  it('sum bate com a soma BigInt e estoura se QUALQUER prefixo sair da faixa', () => {
    const rng = mulberry32(31337);
    for (let i = 0; i < 3000; i += 1) {
      const count = Math.floor(rng() * 8);
      const values: bigint[] = [];
      for (let j = 0; j < count; j += 1) values.push(randomSafe(rng));
      let running = 0n;
      let overflow = false;
      for (const v of values) {
        running += v;
        if (running > MAX_BIG || running < -MAX_BIG) overflow = true;
      }
      const list = values.map(asCentsBig);
      if (overflow) {
        expectCode(() => sum(list), 'out_of_range');
      } else {
        expect(sum(list)).toBe(Number(running));
      }
    }
  });

  it('sum independe da ordem quando nenhum prefixo estoura', () => {
    const rng = mulberry32(606);
    for (let i = 0; i < 2000; i += 1) {
      const values: bigint[] = [];
      for (let j = 0; j < 6; j += 1) values.push(randomBig(rng, 12) * (rng() < 0.5 ? -1n : 1n));
      const forward = values.map(asCentsBig);
      const backward = [...forward].reverse();
      expect(sum(forward)).toBe(sum(backward));
    }
  });

  it('add é comutativo; negate é involução; x + (-x) é +0', () => {
    const rng = mulberry32(909);
    for (let i = 0; i < 3000; i += 1) {
      const a = randomSafe(rng);
      const b = randomSafe(rng);
      const x = asCentsBig(a);
      expect(negate(negate(x))).toBe(Number(a));
      expect(Object.is(add(x, negate(x)), 0)).toBe(true);
      const total = a + b;
      if (total <= MAX_BIG && total >= -MAX_BIG) {
        expect(add(x, asCentsBig(b))).toBe(Number(total));
        expect(add(x, asCentsBig(b))).toBe(add(asCentsBig(b), x));
      }
    }
  });
});

describe('casos de borda explícitos', () => {
  it.each([
    [' -12,30 ', -1230],
    ['- R$ 12,30', -1230],
    ['R$ - 12,30', -1230],
    [' 12,30 ', 1230],
    ['R$ 12,30', 1230],
    ['R$ 12,30', 1230],
    ['+ 12,30', 1230],
    ['- 12,30', -1230],
    ['R$ - 12,30', -1230],
    ['R$ +12,30', 1230],
    ['-R$ 12,30', -1230],
    ['00,00', 0],
    ['007', 700],
    ['000000000000000000001,00', 100],
    ['0'.repeat(20) + '90071992547409,91', MAX],
    ['1.234.567,89', 123456789],
    ['1.234.567', 123456700],
    ['1.234,5', 123450],
    ['0,29', 29],
    ['1,15', 115],
    ['4,35', 435],
    ['(R$12,30)', -1230],
    ['(R$ 12,30)', -1230],
    ['(90.071.992.547.409,91)', -MAX],
  ])('aceita %j como %s', (entrada, esperado) => {
    expect(parseBRL(entrada)).toBe(esperado);
  });

  it.each([
    ['  ', 'empty'],
    ['12 ,30', 'invalid_format'],
    ['12 30', 'invalid_format'],
    ['1 234,56', 'invalid_format'],
    ['R$\t12,30', 'invalid_format'],
    ['12​,30', 'invalid_format'],
    ['​12,30', 'invalid_format'],
    ['12 ,30', 'invalid_format'],
    ['12\n,30', 'invalid_format'],
    ['١٢,٣٠', 'invalid_format'],
    ['１２,３０', 'invalid_format'],
    ['12，30', 'invalid_format'],
    ['12,３０', 'invalid_format'],
    ['1.23.456', 'invalid_format'],
    ['1..234', 'invalid_format'],
    ['.123', 'invalid_format'],
    ['1,,23', 'invalid_format'],
    ['1.234,', 'invalid_format'],
    ['1.234,567', 'invalid_format'],
    ['1,234', 'invalid_format'],
    ['1,234.56', 'ambiguous_format'],
    ['R$ 1,234.56', 'ambiguous_format'],
    ['-1,234.56', 'ambiguous_format'],
    ['(1,234.56)', 'ambiguous_format'],
    ['1,234,567.89', 'ambiguous_format'],
    ['1.234,56.78', 'ambiguous_format'],
    ['9007199254740991', 'out_of_range'],
    ['-90.071.992.547.409,92', 'out_of_range'],
    ['90.071.992.547.410,00', 'out_of_range'],
    ['(90.071.992.547.409,92)', 'out_of_range'],
    ['+', 'invalid_format'],
    ['-', 'invalid_format'],
    ['-R$', 'invalid_format'],
    ['R$', 'invalid_format'],
    ['R$-', 'invalid_format'],
    ['+-12,30', 'invalid_format'],
    ['-+12,30', 'invalid_format'],
    ['++12', 'invalid_format'],
    ['--12', 'invalid_format'],
    ['- -12,30', 'invalid_format'],
    ['R$ -R$ 12', 'invalid_format'],
    ['-R$ -12,30', 'invalid_format'],
    ['-R$ +12,30', 'invalid_format'],
    ['+R$ -12,30', 'invalid_format'],
    ['((12,30))', 'invalid_format'],
    ['(12,30', 'invalid_format'],
    ['12,30)', 'invalid_format'],
    ['()', 'invalid_format'],
    ['(R$)', 'invalid_format'],
    ['(,)', 'invalid_format'],
    ['-(12,30)', 'invalid_format'],
    ['+(12,30)', 'invalid_format'],
    ['R$ (12,30)', 'invalid_format'],
    ['(-12,30)', 'invalid_format'],
    ['( 12,30 )', 'invalid_format'],
  ])('recusa %j como %s', (entrada, code) => {
    expectCode(() => parseBRL(entrada), code as MoneyErrorCode);
  });

  it.each(['-0', '+0', '0', '00,00', '-0,00', '- 0,00', 'R$ -0,00', '(0)', '(0,00)', '-R$ 0'])(
    'zero %j volta como +0 (Object.is)',
    (entrada) => {
      expect(Object.is(parseBRL(entrada), 0)).toBe(true);
    },
  );

  it.each([
    [99999, 'R$ 999,99'],
    [100000, 'R$ 1.000,00'],
    [999999, 'R$ 9.999,99'],
    [1000000, 'R$ 10.000,00'],
    [-100, '-R$ 1,00'],
    [-5, '-R$ 0,05'],
    [-0, 'R$ 0,00'],
    [-MAX, '-R$ 90.071.992.547.409,91'],
  ])('formata %s como %j', (entrada, esperado) => {
    expect(formatBRL(asCents(entrada))).toBe(esperado);
  });

  it('fromDb: texto e bigint aceitam só inteiro seguro; zero sempre +0', () => {
    expect(Object.is(fromDb('-0'), 0)).toBe(true);
    expect(Object.is(fromDb(0n), 0)).toBe(true);
    expect(Object.is(fromDb(-0), 0)).toBe(true);
    expect(fromDb(-MAX)).toBe(-MAX);
    expect(fromDb(-MAX_BIG)).toBe(-MAX);
    expect(fromDb(12.0)).toBe(12);
    expectCode(() => fromDb(9007199254740992), 'out_of_range');
    expectCode(() => fromDb(1e21), 'out_of_range');
    expectCode(() => fromDb(NaN), 'not_integer');
    expectCode(() => fromDb(Infinity), 'not_integer');
    expectCode(() => fromDb('9'.repeat(400)), 'out_of_range');
    expectCode(() => fromDb('9007199254740991\n'), 'invalid_format');
    expectCode(() => fromDb(' 9'), 'invalid_format');
    expectCode(() => fromDb('-'), 'invalid_format');
    expectCode(() => fromDb('９'), 'invalid_format');
  });

  it('cents: não inteiros e extremos', () => {
    expectCode(() => cents(Number.MIN_VALUE), 'not_integer');
    expectCode(() => cents(Number.EPSILON), 'not_integer');
    expectCode(() => cents('12' as unknown as number), 'not_integer');
    expect(Object.is(cents(-0), 0)).toBe(true);
  });

  it('aritmética nos limites', () => {
    expect(add(asCents(MAX), asCents(0))).toBe(MAX);
    expect(add(asCents(-MAX), asCents(0))).toBe(-MAX);
    expect(Object.is(add(asCents(MAX), asCents(-MAX)), 0)).toBe(true);
    expectCode(() => add(asCents(MAX), asCents(1)), 'out_of_range');
    expectCode(() => add(asCents(-MAX), asCents(-1)), 'out_of_range');
    expectCode(() => sum([asCents(-MAX), asCents(-1)]), 'out_of_range');
    expect(sum([asCents(MAX), asCents(-1), asCents(1)])).toBe(MAX);
    expect(sum([asCents(-1), asCents(MAX), asCents(-MAX)])).toBe(-1);
    expect(Object.is(sum([]), 0)).toBe(true);
    expect(sum(Array.from({ length: 100000 }, () => asCents(1)))).toBe(100000);
    expect(negate(asCents(MAX))).toBe(-MAX);
    expect(negate(asCents(-MAX))).toBe(MAX);
    expect(Object.is(negate(asCents(0)), 0)).toBe(true);
    expect(Object.is(negate(asCents(-0)), 0)).toBe(true);
  });
});

describe('MoneyError', () => {
  it('é Error, tem nome literal e código; a mensagem é útil e sem dígitos', () => {
    const e = captured(() => parseBRL('12,345'));
    expect(e).toBeInstanceOf(MoneyError);
    expect(e).toBeInstanceOf(Error);
    expect((e as MoneyError).name).toBe('MoneyError');
    expect((e as MoneyError).code).toBe('invalid_format');
    expect((e as MoneyError).message.length).toBeGreaterThan(10);
    expect(String(e)).toMatch(/^MoneyError: /);
  });

  it('cada código é alcançável pela API pública', () => {
    const reached = new Set<MoneyErrorCode>();
    const probes: Array<() => unknown> = [
      () => parseBRL(''),
      () => parseBRL('abc'),
      () => parseBRL('1,234.56'),
      () => parseBRL('9007199254740991'),
      () => cents(1.5),
    ];
    for (const probe of probes) {
      const e = captured(probe);
      if (e instanceof MoneyError) reached.add(e.code);
    }
    expect([...reached].sort()).toEqual([
      'ambiguous_format',
      'empty',
      'invalid_format',
      'not_integer',
      'out_of_range',
    ]);
  });
});

describe('decisões do dev (Riscos e dúvidas do T1.1): comportamento atual, a confirmar pelo dono', () => {
  it('(-12,30) é recusado: dupla negação, consistente com -(12,30) listado na T1.0', () => {
    expectCode(() => parseBRL('(-12,30)'), 'invalid_format');
  });

  it('( 12,30 ) é recusado: a T1.0 só tira espaços das pontas da entrada; nada define espaço dentro dos parênteses', () => {
    expectCode(() => parseBRL('( 12,30 )'), 'invalid_format');
  });
});

describe('T1.1b: correções dos achados do QA (antes it.fails, agora asserções diretas)', () => {
  it('BUG-1 (corrigido): entrada não-string em parseBRL lança MoneyError invalid_format, não TypeError', () => {
    expectCode(() => parseBRL(undefined as unknown as string), 'invalid_format');
  });

  it('BUG-2 (corrigido): add e sum validam os operandos; 0,5 + 0,5 com cast lança not_integer', () => {
    expectCode(() => add(0.5 as Cents, 0.5 as Cents), 'not_integer');
    expectCode(() => sum([0.5 as Cents, 0.5 as Cents]), 'not_integer');
  });
});

describe('T1.1b: decisão do dono sobre espaços (DESVIO-3 virou caracterização)', () => {
  // Decisão do dono: a gramática mantém "zero ou mais" espaços depois do sinal e de R$.
  // Registrado no cartão T1.1b (seção "Decisão pendente do dono"). Se o dono mudar para "no máximo um",
  // estes dois testes passam a esperar invalid_format e entram casos novos.
  it('"R$  12,30" (dois espaços depois de R$) vale 1230', () => {
    expect(parseBRL('R$  12,30')).toBe(1230);
  });

  it('"-   12,30" (três espaços depois do sinal) vale -1230', () => {
    expect(parseBRL('-   12,30')).toBe(-1230);
  });
});

describe('T1.1b (QA): trim() e comentário de parseBRL', () => {
  it('trim remove tab, quebra de linha e BOM nas pontas, como o comentário diz', () => {
    expect(parseBRL('\t12,30\n')).toBe(1230);
    expect(parseBRL('﻿12,30')).toBe(1230);
  });

  it('espaço de largura zero (U+200B) não é removido pelo trim e é recusado', () => {
    expectCode(() => parseBRL('12,30​'), 'invalid_format');
  });
});

/** Valores que não são número nem texto legítimo. Cada um deve virar MoneyError, nunca TypeError. */
const STRANGE: ReadonlyArray<readonly [string, unknown]> = [
  ['Symbol', Symbol('x')],
  ['função', () => 12],
  ['array com texto', ['12,30']],
  ['array com número', [12]],
  ['array vazio', []],
  ['Date', new Date(0)],
  ['objeto com valueOf e toString', { valueOf: () => 12, toString: () => '12,30' }],
  ['objeto só com toString', { toString: () => '12' }],
  ['objeto com Symbol.toPrimitive', { [Symbol.toPrimitive]: () => 12 }],
  ['String de objeto', new String('12,30')],
  ['Number de objeto', new Number(12)],
  ['Set', new Set([12])],
  ['Map', new Map()],
  [
    'Proxy com traps que lançam',
    new Proxy(
      {},
      {
        get: () => {
          throw new Error('trap');
        },
      },
    ),
  ],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['-Infinity', -Infinity],
  ['bigint 0', 0n],
  ['bigint 10', 10n],
  ['bigint -10', -10n],
  ['true', true],
  ['false', false],
  ['null', null],
  ['undefined', undefined],
  ['texto numérico', '12'],
  ['texto com centavos', '12,30'],
  ['texto vazio', ''],
  ['número 0,5', 0.5],
  ['número 2 ** 53', 2 ** 53],
  ['número 2 ** 60', 2 ** 60],
];

const NON_TEXT = STRANGE.filter(([, v]) => typeof v !== 'string');
const NOT_STR_NUM_BIG = STRANGE.filter(
  ([, v]) => !['string', 'number', 'bigint'].includes(typeof v),
);
const NOT_NUMBER = STRANGE.filter(([, v]) => typeof v !== 'number');
const NON_ARRAY = STRANGE.filter(([, v]) => !Array.isArray(v));

describe('T1.1b (QA): ataque a tipos estranhos, sempre MoneyError com código e sem dígitos', () => {
  for (const [label, value] of NON_TEXT) {
    it(`parseBRL(${label}) lança invalid_format`, () => {
      expectCode(() => parseBRL(value as never), 'invalid_format');
    });
  }

  for (const [label, value] of NOT_STR_NUM_BIG) {
    it(`fromDb(${label}) lança invalid_format`, () => {
      expectCode(() => fromDb(value as never), 'invalid_format');
    });
  }

  for (const [label, value] of NON_ARRAY) {
    it(`sum(${label}) (não é array) lança invalid_format`, () => {
      expectCode(() => sum(value as never), 'invalid_format');
    });
  }

  for (const [label, value] of NOT_NUMBER) {
    it(`cents(${label}) lança not_integer`, () => {
      expectCode(() => cents(value as never), 'not_integer');
    });

    it(`formatBRL(${label}) lança not_integer`, () => {
      expectCode(() => formatBRL(value as never), 'not_integer');
    });

    it(`add(${label}, 1) lança not_integer (operando a)`, () => {
      expectCode(() => add(value as never, asCents(1)), 'not_integer');
    });

    it(`add(1, ${label}) lança not_integer (operando b)`, () => {
      expectCode(() => add(asCents(1), value as never), 'not_integer');
    });

    it(`sum([${label}]) lança not_integer`, () => {
      expectCode(() => sum([value as never]), 'not_integer');
    });
  }

  it('string numérica em add: add("12", 1) e add(1, "12") lançam not_integer', () => {
    expectCode(() => add('12' as never, asCents(1)), 'not_integer');
    expectCode(() => add(asCents(1), '12' as never), 'not_integer');
  });

  it('sum de Set, Map, string e gerador (iteráveis que não são array) lançam invalid_format, sem iterar', () => {
    let pulled = 0;
    const gen = (function* (): Generator<number> {
      pulled += 1;
      yield 1;
    })();
    for (const value of [new Set([1]), new Map(), '12', gen]) {
      expectCode(() => sum(value as never), 'invalid_format');
    }
    expect(pulled).toBe(0);
  });

  it('sum com array de Proxy (Array.isArray verdadeiro) soma normalmente', () => {
    expect(sum(new Proxy([asCents(2), asCents(3)], {}))).toBe(5);
  });

  it('sum com buraco no array (holes) lança not_integer, não TypeError', () => {
    const holes: Cents[] = new Array<Cents>(2);
    holes[1] = asCents(1);
    expectCode(() => sum(holes), 'not_integer');
  });

  it('nenhuma função coage o argumento: valueOf, toString e Symbol.toPrimitive nunca são chamados', () => {
    let calls = 0;
    const spy = {
      valueOf: (): number => {
        calls += 1;
        return 12;
      },
      toString: (): string => {
        calls += 1;
        return '12';
      },
      [Symbol.toPrimitive]: (): number => {
        calls += 1;
        return 12;
      },
    };
    const attempts: Array<() => unknown> = [
      () => parseBRL(spy as never),
      () => fromDb(spy as never),
      () => cents(spy as never),
      () => formatBRL(spy as never),
      () => add(spy as never, asCents(1)),
      () => add(asCents(1), spy as never),
      () => sum([spy as never]),
      () => sum(spy as never),
    ];
    for (const attempt of attempts) {
      expect(captured(attempt)).toBeInstanceOf(MoneyError);
    }
    expect(calls).toBe(0);
  });

  it('zeros vindos de tipos novos saem como +0 (Object.is)', () => {
    expect(Object.is(add(-0 as Cents, -0 as Cents), 0)).toBe(true);
    expect(Object.is(sum([-0 as Cents]), 0)).toBe(true);
    expect(Object.is(fromDb(-0), 0)).toBe(true);
    expect(Object.is(fromDb(0n), 0)).toBe(true);
    expect(formatBRL(-0 as Cents)).toBe('R$ 0,00');
  });
});

describe('T1.1b (QA): fuzz determinístico de add e sum contra modelo exato em BigInt', () => {
  // Modelo: o primeiro operando/elemento inválido define o erro; depois, a faixa é checada a cada passo.
  // O código esperado é o mesmo que a especificação da T1.0 pede (not_integer, out_of_range).
  const POOL: unknown[] = [
    0.5,
    -0.5,
    NaN,
    Infinity,
    -Infinity,
    -0,
    2 ** 53,
    -(2 ** 53),
    2 ** 60,
    1e21,
    MAX,
    -MAX,
    1,
    -1,
    12,
    '12',
    null,
    true,
    1n,
    () => 1,
  ];

  /** Código esperado para um valor isolado (cents), ou null se for inteiro seguro. */
  function codeFor(v: unknown): MoneyErrorCode | null {
    if (typeof v !== 'number' || !Number.isInteger(v)) return 'not_integer';
    if (!Number.isSafeInteger(v)) return 'out_of_range';
    return null;
  }

  /** Modelo de sum: ou o total exato em BigInt, ou o código do primeiro erro. */
  function modelSum(list: unknown[]): { total: bigint } | { code: MoneyErrorCode } {
    let total = 0n;
    for (const v of list) {
      const bad = codeFor(v);
      if (bad !== null) return { code: bad };
      total += BigInt(v as number);
      if (total > MAX_BIG || total < -MAX_BIG) return { code: 'out_of_range' };
    }
    return { total };
  }

  it('sum: 4000 listas mistas batem com o modelo (valor exato ou código exato)', () => {
    const rng = mulberry32(8080);
    const problems: string[] = [];
    for (let i = 0; i < 4000; i += 1) {
      const len = Math.floor(rng() * 6);
      const list: unknown[] = [];
      for (let j = 0; j < len; j += 1) {
        list.push(rng() < 0.5 ? pick(rng, POOL) : Number(randomSafe(rng)));
      }
      const expected = modelSum(list);
      const e = captured(() => sum(list as never));
      if ('total' in expected) {
        if (e !== undefined || !Object.is(sum(list as never), Number(expected.total))) {
          problems.push(`sum(${i}) deveria dar ${String(expected.total)}`);
        }
      } else {
        if (!(e instanceof MoneyError) || e.code !== expected.code || /\d/.test(e.message)) {
          problems.push(`sum(${i}) deveria dar ${expected.code}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('add: 4000 pares mistos batem com o modelo, operando a antes de b', () => {
    const rng = mulberry32(7373);
    const problems: string[] = [];
    for (let i = 0; i < 4000; i += 1) {
      const a = rng() < 0.5 ? pick(rng, POOL) : Number(randomSafe(rng));
      const b = rng() < 0.5 ? pick(rng, POOL) : Number(randomSafe(rng));
      const bad = codeFor(a) ?? codeFor(b);
      const exact = bad === null ? BigInt(a as number) + BigInt(b as number) : null;
      const outside = exact !== null && (exact > MAX_BIG || exact < -MAX_BIG);
      const expectedCode: MoneyErrorCode | null = bad ?? (outside ? 'out_of_range' : null);
      const e = captured(() => add(a as never, b as never));
      if (expectedCode === null) {
        if (e !== undefined || !Object.is(add(a as never, b as never), Number(exact))) {
          problems.push(`add(${i}) deveria dar valor exato`);
        }
      } else if (!(e instanceof MoneyError) || e.code !== expectedCode) {
        problems.push(`add(${i}) deveria dar ${expectedCode}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('fromDb: 4000 valores de tipos mistos: só string, number ou bigint passam; o resto é invalid_format', () => {
    const rng = mulberry32(6464);
    const problems: string[] = [];
    for (let i = 0; i < 4000; i += 1) {
      const v = pick(rng, [...POOL, '9007199254740991', '-12', '12.5', 9007199254740993n]);
      const isTextual = typeof v === 'string' || typeof v === 'number' || typeof v === 'bigint';
      let result: number | undefined;
      const e = captured(() => {
        result = fromDb(v as never);
      });
      if (!isTextual) {
        if (!(e instanceof MoneyError) || e.code !== 'invalid_format') {
          problems.push(`fromDb(${i}) deveria dar invalid_format`);
        }
      } else if (e !== undefined) {
        if (!(e instanceof MoneyError) || /\d/.test(e.message)) problems.push(`fromDb(${i}) vazou`);
      } else if (!Number.isSafeInteger(result) || Object.is(result, -0)) {
        problems.push(`fromDb(${i}) aceitou valor fora de Cents`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('T1.1b (QA): fromDb e add com -0 e fronteira, sem mudança de sinal', () => {
  it('-0 em add com operando de cast volta como +0 em qualquer ordem', () => {
    expect(Object.is(add(asCents(0), -0 as Cents), 0)).toBe(true);
    expect(Object.is(add(-0 as Cents, asCents(0)), 0)).toBe(true);
  });

  it('bigint e number na fronteira exata passam, MAX+1 é out_of_range pelas duas portas', () => {
    expect(fromDb(MAX_BIG)).toBe(MAX);
    expect(fromDb(-MAX_BIG)).toBe(-MAX);
    expectCode(() => fromDb(MAX_BIG + 1n), 'out_of_range');
    expectCode(() => fromDb(-MAX_BIG - 1n), 'out_of_range');
    expectCode(() => fromDb(MAX + 2), 'out_of_range');
  });
});

describe('achado novo do QA (BUG-4, it.fails): negate não valida o operando', () => {
  // negate faz `0 - value`, então coage tipos estranhos sem erro. A T1.1b corrigiu add e sum,
  // mas não negate. Mesma classe do BUG-2. Gravidade: baixa, porque só aparece com cast.
  it.fails('BUG-4a (baixa): negate(null) devolve 0; deveria lançar not_integer', () => {
    expectCode(() => negate(null as never), 'not_integer');
  });

  it.fails('BUG-4b (baixa): negate("12") devolve -12; deveria lançar not_integer', () => {
    expectCode(() => negate('12' as never), 'not_integer');
  });

  it.fails(
    'BUG-4c (baixa): negate(10n) lança TypeError; deveria lançar MoneyError not_integer',
    () => {
      expectCode(() => negate(10n as never), 'not_integer');
    },
  );
});
