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

// QA da T1.1 (Money). Os casos da T1.0 ficam em tests/domain/money/ e não são repetidos aqui.
// Este arquivo traz os ataques: propriedades, fuzz contra leitura de referência, bordas em
// torno de MAX_SAFE_INTEGER, -0, espaços especiais (U+00A0, U+202F), somas longas e entradas
// longas. Todas as entradas são sintéticas e geradas com semente fixa (sem Math.random).

const MAX = Number.MAX_SAFE_INTEGER;
const MAX_BIG = BigInt(MAX);
const CODIGOS: readonly MoneyErrorCode[] = [
  'empty',
  'invalid_format',
  'ambiguous_format',
  'out_of_range',
  'not_integer',
];

const asCents = (n: number): Cents => n as Cents;

type Resultado =
  { ok: true; valor: number } | { ok: false; codigo: MoneyErrorCode; mensagem: string };

/** Roda uma operação. Erro que não seja MoneyError deixa o teste falhar. */
function rodar(fn: () => Cents): Resultado {
  try {
    return { ok: true, valor: fn() };
  } catch (erro) {
    if (erro instanceof MoneyError) {
      return { ok: false, codigo: erro.code, mensagem: erro.message };
    }
    throw erro;
  }
}

/** Confere que a operação lança MoneyError com o código dado e mensagem sem dígitos. */
function esperaErro(fn: () => unknown, codigo: MoneyErrorCode): void {
  let capturado: unknown;
  try {
    fn();
  } catch (erro) {
    capturado = erro;
  }
  expect(capturado).toBeInstanceOf(MoneyError);
  const erro = capturado as MoneyError;
  expect(erro.code).toBe(codigo);
  expect(erro.name).toBe('MoneyError');
  expect(erro.message.length).toBeGreaterThan(0);
  expect(erro.message).not.toMatch(/\d/);
}

/**
 * Gerador mulberry32 com semente fixa (PRNG de 32 bits, distribuição boa, sem Math.random).
 * Só gera entradas de teste. Não usar LCG com módulo 2^k: os bits baixos têm período curto.
 */
function geradorDeterministico(semente: number) {
  let estado = semente | 0;
  const proximo = (): number => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), estado | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** Inteiro em [0, n). */
    ate(n: number): number {
      return Math.floor(proximo() * n);
    },
    /** Inteiro seguro em [0, MAX_SAFE_INTEGER], com 53 bits pseudoaleatórios. */
    seguro(): number {
      return Math.floor(proximo() * 2 ** 21) * 2 ** 32 + Math.floor(proximo() * 2 ** 32);
    },
  };
}

type Gerador = ReturnType<typeof geradorDeterministico>;

/** Inteiros seguros com 1 a 16 dígitos e sinal misto. */
function amostraSegura(semente: number, quantidade: number): number[] {
  const g = geradorDeterministico(semente);
  const valores: number[] = [];
  for (let i = 0; i < quantidade; i += 1) {
    const digitos = 1 + g.ate(16);
    const magnitude = g.seguro() % 10 ** digitos;
    const negativo = g.ate(2) === 1;
    valores.push(magnitude !== 0 && negativo ? -magnitude : magnitude);
  }
  return valores;
}

/** Valores de borda: potências de 10 ± 1, MAX e vizinhos. */
function valoresDeBorda(): number[] {
  const bordas = [0, 1, -1, 9, 10, 99, 100, 101, 999, 1000, MAX, -MAX, MAX - 1, 1 - MAX];
  for (let k = 1; k <= 15; k += 1) {
    bordas.push(10 ** k - 1, 10 ** k, 10 ** k + 1, -(10 ** k - 1), -(10 ** k), -(10 ** k + 1));
  }
  return bordas;
}

/** Formatação de referência, com BigInt e regex. Não usa a implementação. */
function formatoReferencia(x: number): string {
  const digitos = BigInt(Math.abs(x)).toString().padStart(3, '0');
  const reais = digitos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${x < 0 ? '-' : ''}R$ ${reais},${digitos.slice(-2)}`;
}

type Esperado = { ok: true; valor: bigint } | { ok: false; codigo: MoneyErrorCode };

/** Leitura de referência para entradas só com dígitos, `.`, `,` e `-` no início. */
function leituraReferencia(entrada: string): Esperado {
  if (entrada === '') return { ok: false, codigo: 'empty' };
  const negativo = entrada.startsWith('-');
  const corpo = negativo ? entrada.slice(1) : entrada;
  const ultimaVirgula = corpo.lastIndexOf(',');
  const ultimoPonto = corpo.lastIndexOf('.');
  if (ultimaVirgula !== -1 && ultimoPonto > ultimaVirgula) {
    return { ok: false, codigo: 'ambiguous_format' };
  }
  const m = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/.exec(corpo);
  if (m === null) return { ok: false, codigo: 'invalid_format' };
  const inteiro = (m[1] ?? '').replaceAll('.', '');
  const centavos = (m[2] ?? '').padEnd(2, '0');
  const magnitude = BigInt(inteiro + centavos);
  const valor = negativo ? -magnitude : magnitude;
  if (valor > MAX_BIG || valor < -MAX_BIG) return { ok: false, codigo: 'out_of_range' };
  return { ok: true, valor };
}

/** Texto aleatório a partir de um alfabeto. */
function textoAleatorio(g: Gerador, alfabeto: string, maxLen: number): string {
  const tamanho = g.ate(maxLen + 1);
  let texto = '';
  for (let i = 0; i < tamanho; i += 1) texto += alfabeto.charAt(g.ate(alfabeto.length));
  return texto;
}

/** Texto com cara de BRL (às vezes certo, às vezes com um caractere estranho). */
function brlAleatorio(g: Gerador): string {
  const inteiro = String(g.seguro() % 10 ** (1 + g.ate(16)));
  let corpo = g.ate(2) === 1 ? inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : inteiro;
  const fracao = g.ate(4);
  if (fracao > 0) corpo += `,${String(g.ate(10 ** fracao)).padStart(fracao, '0')}`;
  if (g.ate(4) === 0) {
    const pos = g.ate(corpo.length + 1);
    const ruido = '.,-+() R$  ';
    corpo = corpo.slice(0, pos) + ruido.charAt(g.ate(ruido.length)) + corpo.slice(pos);
  }
  return g.ate(2) === 1 ? `-${corpo}` : corpo;
}

/** Compara uma leitura real com a de referência. Devolve um texto de falha ou null. */
function comparaLeitura(entrada: string, esperado: Esperado): string | null {
  const real = rodar(() => parseBRL(entrada));
  if (esperado.ok) {
    if (!real.ok) return `${JSON.stringify(entrada)}: esperado ok, veio ${real.codigo}`;
    if (Object.is(real.valor, -0) || BigInt(real.valor) !== esperado.valor) {
      return `${JSON.stringify(entrada)}: valor ${real.valor}`;
    }
    return null;
  }
  if (real.ok) return `${JSON.stringify(entrada)}: esperado ${esperado.codigo}, veio valor`;
  if (real.codigo !== esperado.codigo) {
    return `${JSON.stringify(entrada)}: esperado ${esperado.codigo}, veio ${real.codigo}`;
  }
  if (/\d/.test(real.mensagem)) return `${JSON.stringify(entrada)}: mensagem com dígitos`;
  return null;
}

// ---------------------------------------------------------------------------------------------

describe('ida e volta e formatação em amostra grande', () => {
  const amostra = amostraSegura(0xc0ffee, 20_000);

  it('parseBRL(formatBRL(x)) === x para 20 mil inteiros seguros', () => {
    const falhas = amostra.filter((x) => !Object.is(parseBRL(formatBRL(asCents(x))), x));
    expect(falhas).toEqual([]);
  });

  it('formatBRL bate com a referência em BigInt, só com espaço comum (U+0020)', () => {
    const divergentes = amostra.filter((x) => formatBRL(asCents(x)) !== formatoReferencia(x));
    expect(divergentes).toEqual([]);
    const forasDoFormato = amostra.filter(
      (x) => !/^-?R\$ \d{1,3}(\.\d{3})*,\d{2}$/.test(formatBRL(asCents(x))),
    );
    expect(forasDoFormato).toEqual([]);
  });

  it('a amostra de ida e volta passa pelos dois sinais e por todas as magnitudes', () => {
    expect(amostra.some((x) => x < 0)).toBe(true);
    expect(amostra.some((x) => x > 0)).toBe(true);
    expect(amostra.some((x) => Math.abs(x) >= 10 ** 15)).toBe(true);
    expect(amostra.some((x) => Math.abs(x) < 100)).toBe(true);
  });

  it('"reais,centavos" sem agrupamento (5 mil casos) dá reais * 100 + centavos', () => {
    const g = geradorDeterministico(0xabc);
    const divergentes: string[] = [];
    for (let i = 0; i < 5000; i += 1) {
      const reais = g.ate(10 ** 13);
      const cc = g.ate(100);
      const texto = `${reais},${String(cc).padStart(2, '0')}`;
      const r = rodar(() => parseBRL(texto));
      if (!r.ok || BigInt(r.valor) !== BigInt(reais * 100 + cc)) divergentes.push(texto);
    }
    expect(divergentes).toEqual([]);
  });
});

describe('bordas em torno de MAX_SAFE_INTEGER', () => {
  it.each([
    ['90.071.992.547.409,90', MAX - 1],
    ['90.071.992.547.409,9', MAX - 1],
    ['90071992547409,91', MAX],
    ['90.071.992.547.409,91', MAX],
    ['-90.071.992.547.409,91', -MAX],
    ['-90.071.992.547.409,90', 1 - MAX],
  ])('%j vira %s centavos (dentro da faixa)', (entrada, esperado) => {
    expect(parseBRL(entrada)).toBe(esperado);
  });

  it.each([
    '90.071.992.547.409,92',
    '90071992547409,92',
    '90.071.992.547.410',
    '90071992547410',
    '9007199254740991,00',
    '-90.071.992.547.409,92',
    '99999999999999999999',
  ])('%j é out_of_range (acima do teto)', (entrada) => {
    esperaErro(() => parseBRL(entrada), 'out_of_range');
  });

  it('MAX-1, MAX e -MAX formatam e voltam sem perda', () => {
    expect(formatBRL(asCents(MAX - 1))).toBe('R$ 90.071.992.547.409,90');
    expect(formatBRL(asCents(MAX))).toBe('R$ 90.071.992.547.409,91');
    expect(formatBRL(asCents(-MAX))).toBe('-R$ 90.071.992.547.409,91');
    expect(parseBRL(formatBRL(asCents(MAX - 1)))).toBe(MAX - 1);
    expect(parseBRL(formatBRL(asCents(-MAX)))).toBe(-MAX);
  });

  it('MAX+1 e vizinhos são recusados em cents, fromDb e add', () => {
    esperaErro(() => cents(MAX + 1), 'out_of_range');
    esperaErro(() => cents(MAX + 2), 'out_of_range');
    esperaErro(() => cents(-(MAX + 1)), 'out_of_range');
    esperaErro(() => fromDb('9007199254740992'), 'out_of_range');
    esperaErro(() => fromDb('-9007199254740992'), 'out_of_range');
    esperaErro(() => fromDb(9007199254740992n), 'out_of_range');
    esperaErro(() => fromDb(-9007199254740992n), 'out_of_range');
    esperaErro(() => add(asCents(MAX), asCents(MAX)), 'out_of_range');
    esperaErro(() => add(asCents(-MAX), asCents(-1)), 'out_of_range');
  });

  it('MAX e -MAX entram por fromDb nos três formatos', () => {
    expect(fromDb('9007199254740991')).toBe(MAX);
    expect(fromDb(9007199254740991n)).toBe(MAX);
    expect(fromDb('-9007199254740991')).toBe(-MAX);
    expect(fromDb(-9007199254740991n)).toBe(-MAX);
  });

  it('somas que tocam o teto: MAX-1 + 1 aceita, MAX-1 + 2 estoura, MAX + -MAX zera', () => {
    expect(add(asCents(MAX - 1), asCents(1))).toBe(MAX);
    esperaErro(() => add(asCents(MAX - 1), asCents(2)), 'out_of_range');
    expect(Object.is(add(asCents(MAX), asCents(-MAX)), 0)).toBe(true);
    expect(sum([asCents(MAX), asCents(-MAX), asCents(MAX)])).toBe(MAX);
    esperaErro(
      () => sum([asCents(MAX), asCents(MAX), asCents(-MAX), asCents(-MAX)]),
      'out_of_range',
    );
    esperaErro(() => sum([asCents(-MAX), asCents(-1)]), 'out_of_range');
  });

  it('negate de -MAX e de MAX fica dentro da faixa', () => {
    expect(negate(asCents(-MAX))).toBe(MAX);
    expect(negate(asCents(MAX))).toBe(-MAX);
  });

  it('todos os valores de borda formatam e voltam (ida e volta)', () => {
    const falhas = valoresDeBorda().filter((x) => !Object.is(parseBRL(formatBRL(asCents(x))), x));
    expect(falhas).toEqual([]);
  });
});

describe('-0 em todas as funções', () => {
  it.each(['-0', '(0)', '-0,00', '(0,00)', '-R$ 0,00', 'R$ -0,00', '+0', '(R$ 0,00)', '-0,0'])(
    'parseBRL(%j) devolve +0',
    (entrada) => {
      expect(Object.is(parseBRL(entrada), 0)).toBe(true);
    },
  );

  it('cents(-0), negate(-0) e negate(0) devolvem +0', () => {
    expect(Object.is(cents(-0), 0)).toBe(true);
    expect(Object.is(negate(asCents(-0)), 0)).toBe(true);
    expect(Object.is(negate(asCents(0)), 0)).toBe(true);
  });

  it('formatBRL(-0) é "R$ 0,00", sem sinal', () => {
    expect(formatBRL(asCents(-0))).toBe('R$ 0,00');
  });

  it('fromDb com -0 nos formatos de texto e número devolve +0', () => {
    expect(Object.is(fromDb('-0'), 0)).toBe(true);
    expect(Object.is(fromDb('-00'), 0)).toBe(true);
    expect(Object.is(fromDb('-000000'), 0)).toBe(true);
    expect(Object.is(fromDb(-0), 0)).toBe(true);
  });

  it('add e sum com zeros negativos devolvem +0', () => {
    expect(Object.is(add(asCents(-0), asCents(-0)), 0)).toBe(true);
    expect(Object.is(add(asCents(0), asCents(-0)), 0)).toBe(true);
    expect(Object.is(add(asCents(-5), asCents(5)), 0)).toBe(true);
    expect(Object.is(sum([asCents(-0)]), 0)).toBe(true);
    expect(Object.is(sum([asCents(-0), asCents(-0), asCents(-0)]), 0)).toBe(true);
    expect(Object.is(sum([asCents(-5), asCents(5)]), 0)).toBe(true);
  });
});

describe('espaços especiais (U+00A0 e U+202F)', () => {
  it.each([
    ['R$ 12,30', 1230],
    ['- R$ 12,30', -1230],
    [' 12,30 ', 1230],
    ['R$ - 12,30', -1230],
    ['(R$ 12,30)', -1230],
    ['R$ 12,30', 1230],
    ['  -12,30  ', -1230],
    ['R$ -12,30', -1230],
    [' +R$ 12,30', 1230],
  ])(
    'aceita %j (espaço especial nas pontas ou depois de R$/sinal) como %s',
    (entrada, esperado) => {
      expect(parseBRL(entrada)).toBe(esperado);
    },
  );

  it.each(['1 234,56', '12 30', '( 12,30)', '(12,30 )'])(
    'recusa %j com espaço especial no meio do número ou dentro dos parênteses (invalid_format)',
    (entrada) => {
      esperaErro(() => parseBRL(entrada), 'invalid_format');
    },
  );

  it.each([' ', '   ', '   '])('só espaços especiais %j é empty', (entrada) => {
    esperaErro(() => parseBRL(entrada), 'empty');
  });

  it('formatBRL nunca emite U+00A0 nem U+202F (amostra de 2 mil valores)', () => {
    const saidas = amostraSegura(0x202f, 2000).map((x) => formatBRL(asCents(x)));
    expect(saidas.filter((s) => /[\u00a0\u202f]/.test(s))).toEqual([]);
  });
});

describe('recusas do dev fora dos casos da T1.0 (decisões confirmadas)', () => {
  it.each([
    '(-12,30)',
    '( 12,30 )',
    '(12,30 )',
    '( 12,30)',
    '(+12,30)',
    '(12,30)-',
    '-(12,30)',
    '-R$ -12',
    '-R$ -12,30',
    '+-12',
    '-+12',
    '- - 12',
  ])('%j é invalid_format', (entrada) => {
    esperaErro(() => parseBRL(entrada), 'invalid_format');
  });

  it('mensagens de erro de parseBRL nunca têm dígitos nem repetem a entrada', () => {
    const entradas = [
      '1.234.56',
      '12,345',
      '1,234.56',
      '',
      '  ',
      'abc',
      '-R$ -99,99',
      '99999999999999999999',
    ];
    for (const entrada of entradas) {
      const r = rodar(() => parseBRL(entrada));
      if (!r.ok) {
        expect(/\d/.test(r.mensagem)).toBe(false);
        if (entrada.trim() !== '') expect(r.mensagem).not.toContain(entrada.trim());
      }
    }
  });
});

describe('fuzz de parseBRL contra leitura de referência', () => {
  it('30 mil textos só com dígitos, "," e "." (sinal opcional no início) batem com a referência', () => {
    // Precedência entre ambiguous_format e invalid_format só está definida para estes textos.
    const g = geradorDeterministico(0xbeef);
    const falhas: string[] = [];
    for (let i = 0; i < 30_000; i += 1) {
      const corpo = textoAleatorio(g, '0123456789,.', 20);
      const entrada = g.ate(3) === 0 ? `-${corpo}` : corpo;
      const falha = comparaLeitura(entrada, leituraReferencia(entrada));
      if (falha !== null) falhas.push(falha);
    }
    expect(falhas).toEqual([]);
  });

  it('um "-" solto no meio nunca vira valor (invalid_format ou ambiguous_format, sem dígitos)', () => {
    // Precedência entre os dois códigos com caractere estranho não está na T1.0: o teste só
    // exige que o texto seja recusado com um código de formato.
    const g = geradorDeterministico(0x51ab);
    const problemas: string[] = [];
    for (let i = 0; i < 10_000; i += 1) {
      const corpo = textoAleatorio(g, '0123456789,.', 12);
      // A partir da posição 1: um "-" na posição 0 seria um sinal válido, não um caractere solto.
      const posicao = 1 + g.ate(corpo.length);
      const entrada = corpo.slice(0, posicao) + '-' + corpo.slice(posicao);
      const r = rodar(() => parseBRL(entrada));
      if (r.ok) {
        problemas.push(`${JSON.stringify(entrada)} virou valor ${r.valor}`);
      } else if (r.codigo !== 'invalid_format' && r.codigo !== 'ambiguous_format') {
        problemas.push(`${JSON.stringify(entrada)} deu ${r.codigo}`);
      } else if (/\d/.test(r.mensagem)) {
        problemas.push(`${JSON.stringify(entrada)}: mensagem com dígitos`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('30 mil textos com cara de BRL (com e sem ruído) batem com a referência quando o alfabeto é restrito', () => {
    const g = geradorDeterministico(0xcafe);
    const falhas: string[] = [];
    let aceitos = 0;
    for (let i = 0; i < 30_000; i += 1) {
      const entrada = brlAleatorio(g);
      // Só compara textos que a referência entende (sem espaço, parênteses ou R$).
      if (/^[-0-9.,]*$/.test(entrada)) {
        const esperado = leituraReferencia(entrada);
        if (esperado.ok) aceitos += 1;
        const falha = comparaLeitura(entrada, esperado);
        if (falha !== null) falhas.push(falha);
      }
    }
    expect(falhas).toEqual([]);
    expect(aceitos).toBeGreaterThan(100);
  });

  it('30 mil textos com R$, espaços, parênteses, sinais e U+202F: só valor seguro ou MoneyError sem dígitos', () => {
    const g = geradorDeterministico(0xfeed);
    const alfabeto = '0123456789.,-+() R$  \t x';
    const problemas: string[] = [];
    let aceitos = 0;
    for (let i = 0; i < 30_000; i += 1) {
      const entrada = textoAleatorio(g, alfabeto, 16);
      const r = rodar(() => parseBRL(entrada));
      if (r.ok) {
        aceitos += 1;
        if (!Number.isSafeInteger(r.valor) || Object.is(r.valor, -0)) {
          problemas.push(`${JSON.stringify(entrada)}: valor ${r.valor}`);
        } else if (!Object.is(parseBRL(formatBRL(asCents(r.valor))), r.valor)) {
          problemas.push(`${JSON.stringify(entrada)}: ida e volta falhou`);
        }
      } else {
        if (!CODIGOS.includes(r.codigo)) problemas.push(`código inesperado ${r.codigo}`);
        if (r.mensagem === '' || /\d/.test(r.mensagem)) {
          problemas.push(`${JSON.stringify(entrada)}: mensagem inválida`);
        }
      }
    }
    expect(problemas).toEqual([]);
    expect(aceitos).toBeGreaterThan(100);
  });
});

describe('fromDb: texto, bigint e number', () => {
  it.each(['+12', '--1', '-', '1_000', '12\n', ' 12', '− 12', '١٢', '12.5', '1e3'])(
    'texto %j é invalid_format',
    (entrada) => {
      esperaErro(() => fromDb(entrada), 'invalid_format');
    },
  );

  it.each([
    ['00012', 12],
    ['-00012', -12],
    ['00000000000000000000000000001', 1],
  ])(
    'texto com zeros à esquerda %j vira %s (não especificado; comportamento observado)',
    (entrada, esperado) => {
      expect(fromDb(entrada)).toBe(esperado);
    },
  );

  it('valores ausentes (undefined, null) recebem invalid_format, não TypeError (não especificado)', () => {
    esperaErro(() => fromDb(undefined as unknown as string), 'invalid_format');
    esperaErro(() => fromDb(null as unknown as string), 'invalid_format');
  });

  it('number não seguro e não finito: out_of_range e not_integer', () => {
    esperaErro(() => fromDb(2 ** 53), 'out_of_range');
    esperaErro(() => fromDb(-(2 ** 53)), 'out_of_range');
    esperaErro(() => fromDb(1e300), 'out_of_range');
    esperaErro(() => fromDb(NaN), 'not_integer');
    esperaErro(() => fromDb(Infinity), 'not_integer');
    esperaErro(() => fromDb(-Infinity), 'not_integer');
  });

  it('bigint além da faixa: out_of_range', () => {
    esperaErro(() => fromDb(10n ** 30n), 'out_of_range');
    esperaErro(() => fromDb(-(10n ** 30n)), 'out_of_range');
    esperaErro(() => fromDb('99999999999999999999999999'), 'out_of_range');
  });

  it('propriedade: fromDb(String(x)), fromDb(BigInt(x)) e fromDb(x) devolvem x', () => {
    const amostra = amostraSegura(0xdb, 5000).filter((x) => !Object.is(x, -0));
    const falhas = amostra.filter(
      (x) =>
        !Object.is(fromDb(String(x)), x) ||
        !Object.is(fromDb(BigInt(x)), x) ||
        !Object.is(fromDb(x), x),
    );
    expect(falhas).toEqual([]);
  });
});

describe('sum, add e negate: aritmética exata e estouro a cada passo', () => {
  it('100 mil valores pequenos batem com a soma exata em BigInt', () => {
    const valores = Array.from({ length: 100_000 }, (_, i) => asCents((i % 7) - 3));
    const exato = valores.reduce<bigint>((acc, v) => acc + BigInt(v), 0n);
    expect(sum(valores)).toBe(Number(exato));
  });

  it('100 mil uns somam 100 mil; 100 mil menos uns somam -100 mil', () => {
    expect(sum(Array.from({ length: 100_000 }, () => asCents(1)))).toBe(100_000);
    expect(sum(Array.from({ length: 100_000 }, () => asCents(-1)))).toBe(-100_000);
  });

  it('sum não muta a entrada congelada e não lança', () => {
    const entrada = Object.freeze([asCents(10), asCents(-3), asCents(0)]);
    expect(sum(entrada)).toBe(7);
    expect(entrada.length).toBe(3);
  });

  it('propriedade: sum bate com BigInt e estoura exatamente quando um passo sai da faixa', () => {
    const g = geradorDeterministico(0x5eed);
    const valores = amostraSegura(0x5eed + 1, 6000);
    const erros: string[] = [];
    let estouros = 0;
    let oks = 0;
    let i = 0;
    while (i < valores.length) {
      const tamanho = 1 + g.ate(6);
      const lote = valores.slice(i, i + tamanho).map(asCents);
      i += tamanho;
      let corrente = 0n;
      let estourou = false;
      for (const v of lote) {
        corrente += BigInt(v);
        if (corrente > MAX_BIG || corrente < -MAX_BIG) {
          estourou = true;
          break;
        }
      }
      const r = rodar(() => sum(lote));
      if (estourou) {
        estouros += 1;
        if (r.ok || r.codigo !== 'out_of_range')
          erros.push(`lote ${lote.join(',')}: deveria estourar`);
      } else {
        oks += 1;
        if (!r.ok || BigInt(r.valor) !== corrente)
          erros.push(`lote ${lote.join(',')}: soma errada`);
      }
    }
    expect(erros).toEqual([]);
    expect(estouros).toBeGreaterThan(0);
    expect(oks).toBeGreaterThan(0);
  });

  it('propriedade: add bate com BigInt e estoura exatamente quando sai da faixa', () => {
    const valores = amostraSegura(0xadd, 8000);
    const erros: string[] = [];
    for (let i = 0; i + 1 < valores.length; i += 2) {
      const a = valores[i] ?? 0;
      const b = valores[i + 1] ?? 0;
      const exato = BigInt(a) + BigInt(b);
      const r = rodar(() => add(asCents(a), asCents(b)));
      const fora = exato > MAX_BIG || exato < -MAX_BIG;
      if (fora) {
        if (r.ok || r.codigo !== 'out_of_range') erros.push(`${a}+${b}: deveria estourar`);
      } else if (!r.ok || BigInt(r.valor) !== exato) {
        erros.push(`${a}+${b}: resultado errado`);
      }
    }
    expect(erros).toEqual([]);
  });

  it('propriedade: negate(negate(x)) === x, negate(x) === -x e add(x, negate(x)) é zero', () => {
    const amostra = [...amostraSegura(0x9e9, 5000), 0];
    const erros = amostra.filter((x) => {
      const c = asCents(x);
      const neg = negate(c);
      return (
        !Object.is(negate(neg), x) ||
        !Object.is(neg, x === 0 ? 0 : -x) ||
        !Object.is(add(c, neg), 0)
      );
    });
    expect(erros).toEqual([]);
  });

  it('reexecução: a mesma entrada dá sempre o mesmo resultado (funções puras)', () => {
    const primeiro = parseBRL('-12.345.678,90');
    for (let i = 0; i < 1000; i += 1) {
      expect(parseBRL('-12.345.678,90')).toBe(primeiro);
    }
    expect(formatBRL(primeiro)).toBe(formatBRL(asCents(-1234567890)));
  });
});

describe('entradas longas: não travam (ReDoS) e respondem rápido', () => {
  it.each([
    ['100 mil dígitos', '1'.repeat(100_000)],
    ['ponto 50 mil vezes', '1.'.repeat(50_000)],
    ['vírgula 50 mil vezes', '1,'.repeat(50_000) + '1'],
    ['100 mil parênteses abertos', '('.repeat(100_000)],
    ['50 mil parênteses aninhados', '('.repeat(50_000) + '1' + ')'.repeat(50_000)],
    ['50 mil R$', 'R$'.repeat(50_000)],
    ['vírgula e 100 mil pontos', ',' + '.'.repeat(100_000)],
    ['sinal, 100 mil espaços, letra', '-' + ' '.repeat(100_000) + 'x'],
    ['100 mil U+00A0, valor, 100 mil U+202F', ' '.repeat(100_000) + '1,00' + ' '.repeat(100_000)],
  ])('parseBRL responde em menos de 1 s para entrada com %s', (_nome, entrada) => {
    const inicio = performance.now();
    try {
      parseBRL(entrada);
    } catch (erro) {
      expect(erro).toBeInstanceOf(MoneyError);
    }
    expect(performance.now() - inicio).toBeLessThan(1000);
  });
});

describe('tipos: número puro não entra onde Cents é exigido', () => {
  it('compila só com Cents (verificado pelo pnpm typecheck)', () => {
    // @ts-expect-error número puro não é Cents
    formatBRL(1230);
    // @ts-expect-error número puro não é Cents
    add(1, 2);
    // @ts-expect-error array de números não é Cents[]
    sum([1, 2]);
    // @ts-expect-error número puro não é Cents
    negate(5);
    // @ts-expect-error o resultado de + entre Cents é number, não Cents
    const bruto: Cents = cents(1) + cents(2);
    void bruto;
  });
});

describe('não especificado na T1.0: comportamento observado (não é bug)', () => {
  it.each([
    ['R$ (12,30)', 'invalid_format'],
    ['+(12,30)', 'invalid_format'],
    ['12.30', 'invalid_format'],
    ['1,2,3', 'invalid_format'],
    ['r$ 12,30', 'invalid_format'],
    ['R$  12,30', 'invalid_format'],
  ] as const)('%j cai em %s', (entrada, codigo) => {
    esperaErro(() => parseBRL(entrada), codigo);
  });

  it.each([
    ['R$  12,30', 1230],
    ['R$  -  12,30', -1230],
    ['00012,30', 1230],
    ['012.345,67', 1234567],
    ['\t12,30\n', 1230],
  ])(
    '%j vira %s centavos (espaço extra, zeros à esquerda ou aparas de tab/quebra)',
    (entrada, esperado) => {
      expect(parseBRL(entrada)).toBe(esperado);
    },
  );

  it('parseBRL recebe número em tempo de execução: lança TypeError, não MoneyError (tipo já é string)', () => {
    expect(() => parseBRL(12 as unknown as string)).toThrow(TypeError);
  });
});
