// QA independente da T1.3 (identidade e dedup, domain/transactions/identity.ts).
// Dados sintéticos. Sem Date.now(), sem Math.random(): o fuzz usa um PRNG de semente fixa.
// Os casos da seção C da T1.0 são conferidos em tests/domain/transactions/identity.test.ts;
// aqui ficam propriedades, bordas e ataques.
// Caracteres invisíveis são montados com String.fromCharCode para não depender de escapes no fonte.
// Bugs conhecidos ficam como it.fails (convenção de tests/qa/transactions-qa.test.ts):
//   BUG-T1.3-01: U+0085 (NEL) é espaço em branco pela Unicode, mas não entra no \s do JS.
//   BUG-T1.3-02: ocorrências acima de 2^53 colidem (identityKey repetida).
// Não alterar os testes do dev nem o código de domain/ aqui.
import { describe, expect, it } from 'vitest';
import type { Cents } from '../../domain/money';
import {
  assignIdentities,
  baseKey,
  baseKeyInput,
  identityKey,
  normalizeText,
  type Hash,
  type Mode,
  type NormalizedTransaction,
} from '../../domain/transactions';

const h: Hash = (s) => `h(${s})`;
const identidade: Hash = (s) => s;
const MAX = Number.MAX_SAFE_INTEGER;
const cents = (n: number): Cents => n as Cents;

const NBSP = String.fromCharCode(0xa0);
const NNBSP = String.fromCharCode(0x202f);
const IDEOGRAFICO = String.fromCharCode(0x3000);
const LINHA = String.fromCharCode(0x2028);
const PARAGRAFO = String.fromCharCode(0x2029);
const NEL = String.fromCharCode(0x85);
const SURROGATE_SOZINHO = String.fromCharCode(0xd800);
const ACENTO_COMBINANTE = String.fromCharCode(0x301);
const TREMA_COMBINANTE = String.fromCharCode(0x308);

/** PRNG de semente fixa (mulberry32). Determinístico, sem Math.random. */
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

const DESCRICOES = [
  'Padaria Exemplo',
  '  padaria   EXEMPLO ',
  'Padaria' + NBSP + 'Exemplo',
  'Loja "X" \\ Y',
  'Loja, "X"',
  'Mercado',
  'mercado.',
  'Café',
] as const;
const VALORES = [-830, -831, 0, 500, -1] as const;
const DATAS = ['2026-10-06', '2026-10-07', '2028-02-29'] as const;
const HORAS = [undefined, '09:00'] as const;
const CONTAS = ['conta-1', 'conta-2'] as const;

/** Lote sintético com pool pequeno, para haver duplicatas. Campos fora da identidade variam. */
function gerarLote(rng: () => number): NormalizedTransaction[] {
  const n = Math.floor(rng() * 13);
  const lote: NormalizedTransaction[] = [];
  for (let i = 0; i < n; i++) {
    const hora = escolha(rng, HORAS);
    const t: Record<string, unknown> = {
      source: 'manual',
      accountRef: escolha(rng, CONTAS),
      date: escolha(rng, DATAS),
      description: escolha(rng, DESCRICOES),
      amount: cents(escolha(rng, VALORES)),
      currency: 'BRL',
      type: rng() < 0.5 ? 'expense' : 'income',
      status: rng() < 0.5 ? 'pending' : 'posted',
      externalId: `ext-${Math.floor(rng() * 1000)}`,
      postedAt: escolha(rng, DATAS),
      merchantName: rng() < 0.5 ? 'Loja Um' : undefined,
    };
    if (hora !== undefined) t.time = hora;
    lote.push(t as unknown as NormalizedTransaction);
  }
  return lote;
}

function contagens(lote: readonly NormalizedTransaction[], hash: Hash): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of lote) {
    const k = baseKey(t, hash);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function run(
  lote: readonly NormalizedTransaction[],
  counts: ReadonlyMap<string, number>,
  mode: Mode,
  hash: Hash = h,
) {
  return assignIdentities(lote, counts, mode, hash);
}

function tx(over: Record<string, unknown>): NormalizedTransaction {
  return {
    source: 'manual',
    accountRef: 'conta-1',
    date: '2026-10-06',
    description: 'Padaria Exemplo',
    amount: cents(-830),
    currency: 'BRL',
    type: 'expense',
    status: 'posted',
    ...over,
  };
}

const BASE = tx({});

describe('QA T1.3: propriedades com semente fixa (300 lotes por propriedade)', () => {
  const RODADAS = 300;

  it('reimportação integral em complete nunca cria linha nova, e as ocorrências são 1..n', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= RODADAS; seed++) {
      const lote = gerarLote(prng(seed));
      const counts = contagens(lote, h);
      const r = run(lote, counts, 'complete');
      if (r.some((x) => x.isNew)) problemas.push(`semente ${seed}: isNew em reimportação integral`);
      const vistos = new Map<string, number>();
      for (const x of r) {
        const esperado = (vistos.get(x.baseKey) ?? 0) + 1;
        vistos.set(x.baseKey, esperado);
        if (x.occurrence !== esperado) problemas.push(`semente ${seed}: ocorrência fora de ordem`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('em complete, o número de novas = soma de max(0, contagem no lote − existente) por baseKey', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= RODADAS; seed++) {
      const rng = prng(seed * 7919);
      const lote = gerarLote(rng);
      const naLote = contagens(lote, h);
      const existente = new Map<string, number>();
      for (const [k, c] of naLote) {
        existente.set(k, Math.floor(rng() * (c + 3)));
      }
      // chave que não está no lote também no mapa: não deve alterar nada
      existente.set('h(chave-de-outro-lote)', 7);
      const esperadoNovas = [...naLote].reduce(
        (soma, [k, c]) => soma + Math.max(0, c - (existente.get(k) ?? 0)),
        0,
      );
      const r = run(lote, existente, 'complete');
      const novas = r.filter((x) => x.isNew).length;
      if (novas !== esperadoNovas) {
        problemas.push(`semente ${seed}: ${novas} novas, esperado ${esperadoNovas}`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('em incremental, tudo é novo e as ocorrências continuam a contagem gravada, sem buraco', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= RODADAS; seed++) {
      const rng = prng(seed * 104729);
      const lote = gerarLote(rng);
      const existente = new Map<string, number>();
      for (const k of contagens(lote, h).keys()) {
        existente.set(k, Math.floor(rng() * 5));
      }
      const r = run(lote, existente, 'incremental');
      if (r.length !== lote.length) problemas.push(`semente ${seed}: tamanho diferente`);
      if (!r.every((x) => x.isNew)) problemas.push(`semente ${seed}: incremental sem isNew`);
      const vistos = new Map<string, number>();
      for (const x of r) {
        const base = existente.get(x.baseKey) ?? 0;
        const n = (vistos.get(x.baseKey) ?? 0) + 1;
        vistos.set(x.baseKey, n);
        if (x.occurrence !== base + n) problemas.push(`semente ${seed}: buraco na contagem`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('identityKey é única dentro do lote, em complete e em incremental', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= RODADAS; seed++) {
      const rng = prng(seed * 31);
      const lote = gerarLote(rng);
      const existente = new Map<string, number>();
      for (const [k, c] of contagens(lote, h)) existente.set(k, Math.floor(rng() * (c + 1)));
      for (const modo of ['complete', 'incremental'] as const) {
        const ids = run(lote, existente, modo).map((x) => x.identityKey);
        if (new Set(ids).size !== ids.length) problemas.push(`semente ${seed}, ${modo}: colisão`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('a ordem do lote não muda o conjunto de identidades nem o número de novas (dados fora de ordem)', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= RODADAS; seed++) {
      const rng = prng(seed * 53);
      const lote = gerarLote(rng);
      const existente = new Map<string, number>();
      for (const [k, c] of contagens(lote, h)) existente.set(k, Math.floor(rng() * c));
      const embaralhado = [...lote];
      for (let i = embaralhado.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = embaralhado[i] as NormalizedTransaction;
        embaralhado[i] = embaralhado[j] as NormalizedTransaction;
        embaralhado[j] = tmp;
      }
      for (const modo of ['complete', 'incremental'] as const) {
        const a = run(lote, existente, modo);
        const b = run(embaralhado, existente, modo);
        const ida = a.map((x) => x.identityKey).sort();
        const idb = b.map((x) => x.identityKey).sort();
        if (JSON.stringify(ida) !== JSON.stringify(idb)) {
          problemas.push(`semente ${seed}, ${modo}: conjunto muda com a ordem`);
        }
        const novasA = a.filter((x) => x.isNew).length;
        const novasB = b.filter((x) => x.isNew).length;
        if (novasA !== novasB) problemas.push(`semente ${seed}, ${modo}: novas mudam com a ordem`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('reexecução: depois de gravar as novas, repetir o mesmo lote em complete não cria nada', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= RODADAS; seed++) {
      const rng = prng(seed * 977);
      const lote = gerarLote(rng);
      const gravado = new Map<string, number>();
      for (const [k, c] of contagens(lote, h)) gravado.set(k, Math.floor(rng() * (c + 1)));
      const primeira = run(lote, gravado, 'complete');
      for (const x of primeira) {
        if (x.isNew) gravado.set(x.baseKey, (gravado.get(x.baseKey) ?? 0) + 1);
      }
      const segunda = run(lote, gravado, 'complete');
      if (segunda.some((x) => x.isNew)) problemas.push(`semente ${seed}: reexecução criou linha`);
    }
    expect(problemas).toEqual([]);
  });

  it('a saída mantém a ordem e a referência de cada transação do lote', () => {
    for (let seed = 1; seed <= RODADAS; seed++) {
      const lote = gerarLote(prng(seed * 3));
      const r = run(lote, new Map(), 'complete');
      expect(r).toHaveLength(lote.length);
      r.forEach((x, i) => expect(x.tx).toBe(lote[i]));
    }
  });

  it('a função não muda o lote, as transações nem o mapa (snapshot antes e depois)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const lote = gerarLote(prng(seed * 11)).map((t) => Object.freeze({ ...t }));
      const loteCongelado = Object.freeze(lote);
      const antes = JSON.stringify(loteCongelado);
      const mapa = new Map([
        [h('["manual","conta-1","2026-10-06",null,-830,"padaria exemplo"]'), 1],
      ]);
      const snapMapa = [...mapa.entries()];
      run(loteCongelado, mapa, 'complete');
      run(loteCongelado, mapa, 'incremental');
      expect(JSON.stringify(loteCongelado)).toBe(antes);
      expect([...mapa.entries()]).toEqual(snapMapa);
    }
  });
});

describe('QA T1.3: normalizeText (propriedades e Unicode)', () => {
  const ALFABETO = [
    'a',
    'A',
    'b',
    'Z',
    ' ',
    '\t',
    '\n',
    '\r',
    NBSP,
    NNBSP,
    IDEOGRAFICO,
    LINHA,
    'é',
    'e' + ACENTO_COMBINANTE,
    'ã',
    'Ã',
    'ç',
    'Ç',
    'ü',
    'Ü',
    'ö',
    'å',
    'ß',
    'ẞ',
    'İ',
    'ı',
    '"',
    ',',
    '\\',
    '[',
    ']',
    '|',
    '.',
    '-',
    '0',
    '9',
    SURROGATE_SOZINHO,
    ACENTO_COMBINANTE,
    TREMA_COMBINANTE,
  ] as const;

  function texto(rng: () => number, max: number): string {
    const n = Math.floor(rng() * (max + 1));
    let s = '';
    for (let i = 0; i < n; i++) s += escolha(rng, ALFABETO);
    return s;
  }

  it('é idempotente: normalizar duas vezes dá o mesmo resultado', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 2000; seed++) {
      const s = texto(prng(seed), 12);
      const uma = normalizeText(s);
      if (normalizeText(uma) !== uma) problemas.push(`semente ${seed}`);
    }
    expect(problemas).toEqual([]);
  });

  it('saída sem marca combinante, sem maiúscula, sem espaço repetido nem nas pontas, só espaço comum', () => {
    const problemas: string[] = [];
    const espacoNaoComum = [NBSP, NNBSP, IDEOGRAFICO, LINHA, '\t', '\n', '\r'];
    for (let seed = 1; seed <= 2000; seed++) {
      const r = normalizeText(texto(prng(seed * 5), 14));
      if (/\p{M}/u.test(r)) problemas.push(`semente ${seed}: marca combinante`);
      if (r !== r.toLowerCase()) problemas.push(`semente ${seed}: maiúscula`);
      if (/ {2}/.test(r) || /^ | $/.test(r)) problemas.push(`semente ${seed}: espaço`);
      if ([...r].some((ch) => espacoNaoComum.includes(ch))) {
        problemas.push(`semente ${seed}: espaço não comum`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('NFC e NFD da mesma frase dão o mesmo texto', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 2000; seed++) {
      const s = texto(prng(seed * 13), 12);
      if (normalizeText(s.normalize('NFC')) !== normalizeText(s.normalize('NFD'))) {
        problemas.push(`semente ${seed}`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('NFC e NFD da mesma descrição dão a mesma baseKey', () => {
    const frase = 'Café São João Ação';
    const comNfc = tx({ description: frase.normalize('NFC') });
    const comNfd = tx({ description: frase.normalize('NFD') });
    expect(frase.normalize('NFC')).not.toBe(frase.normalize('NFD'));
    expect(baseKey(comNfc, h)).toBe(baseKey(comNfd, h));
    expect(normalizeText(frase.normalize('NFD'))).toBe('cafe sao joao acao');
  });

  it.each([
    ['U+00A0 entre palavras', 'pao' + NBSP + 'de' + NBSP + 'queijo'],
    ['U+202F (espaço fino estreito)', 'pao' + NNBSP + 'de' + NNBSP + 'queijo'],
    ['U+3000 (espaço ideográfico)', 'pao' + IDEOGRAFICO + 'de' + IDEOGRAFICO + 'queijo'],
    ['tab', 'pao\tde\tqueijo'],
    ['quebra de linha', 'pao\nde\nqueijo'],
    ['CRLF', 'pao\r\nde\r\nqueijo'],
    ['mistura de espaços e quebras', 'pao \t\n' + NBSP + ' de  ' + NNBSP + ' queijo'],
  ])('%s vira espaço comum', (_nome, entrada) => {
    expect(normalizeText(entrada)).toBe('pao de queijo');
  });

  it('espaço de Unicode nas pontas some, como o trim comum', () => {
    expect(normalizeText(NBSP + String.fromCharCode(0x2003) + 'Padaria' + IDEOGRAFICO + '\n')).toBe(
      'padaria',
    );
  });

  it('todo caractere com a propriedade Unicode White_Space vira espaço, exceto U+0085 (BUG-T1.3-01)', () => {
    // U+0085 fica de fora desta varredura porque o it.fails abaixo já documenta o bug.
    const sobra: string[] = [];
    for (let c = 0; c <= 0x10ffff; c++) {
      if (c >= 0xd800 && c <= 0xdfff) continue;
      if (c === 0x85) continue;
      const ch = String.fromCodePoint(c);
      if (!/\p{White_Space}/u.test(ch)) continue;
      if (normalizeText('a' + ch + 'b') !== 'a b') sobra.push(c.toString(16));
    }
    expect(sobra).toEqual([]);
  });

  it.fails('BUG-T1.3-01: U+0085 (NEL) vira espaço comum, como os outros espaços em branco', () => {
    expect(normalizeText('a' + NEL + 'b')).toBe('a b');
  });

  it('pontuação e caixa diferentes continuam diferentes (a pontuação conta)', () => {
    expect(normalizeText('Padaria.')).not.toBe(normalizeText('Padaria'));
    expect(normalizeText('Padaria-X')).not.toBe(normalizeText('Padaria X'));
  });
});

describe('QA T1.3: baseKeyInput e separadores (JSON como separador)', () => {
  it('a entrada continua JSON válido e recupera os campos, para descrições hostis', () => {
    const descricoes = [
      'a","b',
      '","',
      '"]',
      '\\',
      '\\"',
      'linha\nquebra',
      'tab\tx',
      SURROGATE_SOZINHO + ' sozinho',
      'null',
      '[null]',
      '|',
      'a|b|c',
      LINHA + PARAGRAFO,
    ];
    for (const d of descricoes) {
      const t = tx({ description: d, accountRef: 'x","y', time: '12:00' });
      const parsed = JSON.parse(baseKeyInput(t)) as unknown[];
      expect(parsed).toEqual(['manual', 'x","y', '2026-10-06', '12:00', -830, normalizeText(d)]);
    }
  });

  it('separador pipe colidiria: "a|b"+"c" e "a"+"b|c" dão baseKeys diferentes', () => {
    // Com junção por "|", estas duas colidiriam.
    const x = tx({ accountRef: 'a|b', description: 'c' });
    const y = tx({ accountRef: 'a', description: 'b|c' });
    expect(baseKeyInput(x)).not.toBe(baseKeyInput(y));
    expect(baseKey(x, identidade)).not.toBe(baseKey(y, identidade));
  });

  it('separador vírgula colidiria: campo com "," não se confunde com dois campos', () => {
    const x = tx({ accountRef: 'a,b', description: 'c' });
    const y = tx({ accountRef: 'a', description: 'b,c' });
    expect(baseKeyInput(x)).not.toBe(baseKeyInput(y));
  });

  it('time ausente (null) e time com a string "null" são baseKeys diferentes', () => {
    expect(baseKeyInput(tx({}))).not.toBe(baseKeyInput(tx({ time: 'null' })));
  });

  it('time vazio "" e time ausente são baseKeys diferentes (a borda valida o formato)', () => {
    expect(baseKeyInput(tx({ time: '' }))).not.toBe(baseKeyInput(tx({})));
  });

  it('propriedade: tuplas (conta, descrição normalizada) diferentes nunca dão a mesma entrada', () => {
    const ALF = [
      'a',
      'b',
      ' ',
      '|',
      ',',
      '"',
      '\\',
      '[',
      ']',
      'null',
      SURROGATE_SOZINHO,
      NBSP,
    ] as const;
    const vistos = new Map<string, string>();
    for (let seed = 1; seed <= 1500; seed++) {
      const rng = prng(seed);
      const s = (): string => {
        const n = Math.floor(rng() * 4);
        let out = '';
        for (let i = 0; i < n; i++) out += escolha(rng, ALF);
        return out;
      };
      const t = tx({ accountRef: s(), description: s() });
      const tupla = JSON.stringify([t.accountRef, normalizeText(t.description)]);
      const entrada = baseKeyInput(t);
      const anterior = vistos.get(entrada);
      if (anterior !== undefined && anterior !== tupla) {
        throw new Error('colisão de baseKeyInput entre tuplas diferentes');
      }
      vistos.set(entrada, tupla);
    }
    expect(vistos.size).toBeGreaterThan(20);
  });
});

describe('QA T1.3: valores de borda (zero, negativo, centavos, existingCounts)', () => {
  it('-0 e 0 têm a mesma baseKey (zero é zero)', () => {
    expect(baseKeyInput(tx({ amount: cents(-0) }))).toBe(baseKeyInput(tx({ amount: cents(0) })));
  });

  it('um centavo de diferença muda a baseKey (1 e -1, 0 e 1)', () => {
    expect(baseKeyInput(tx({ amount: cents(1) }))).not.toBe(
      baseKeyInput(tx({ amount: cents(-1) })),
    );
    expect(baseKeyInput(tx({ amount: cents(0) }))).not.toBe(baseKeyInput(tx({ amount: cents(1) })));
  });

  it('o inteiro seguro máximo e o mínimo entram na baseKey sem perda', () => {
    expect(baseKeyInput(tx({ amount: cents(MAX) }))).toBe(
      `["manual","conta-1","2026-10-06",null,${MAX},"padaria exemplo"]`,
    );
    expect(baseKeyInput(tx({ amount: cents(-MAX) }))).toContain(`,${-MAX},`);
  });

  it('existingCounts com 0 é aceito e vale o mesmo que chave ausente', () => {
    const comZero = run([BASE], new Map([[baseKey(BASE, h), 0]]), 'complete');
    const ausente = run([BASE], new Map(), 'complete');
    expect(comZero).toEqual(ausente);
  });

  it('existingCounts com -0 é aceito (é zero)', () => {
    const mapa = new Map([[baseKey(BASE, h), -0]]);
    expect(() => run([BASE], mapa, 'complete')).not.toThrow();
    expect(run([BASE], mapa, 'complete')[0]?.isNew).toBe(true);
  });

  it.each([
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['string "2"', '2' as unknown as number],
    ['null', null as unknown as number],
    ['undefined', undefined as unknown as number],
  ])('existingCounts com %s lança Error', (_nome, valor) => {
    expect(() => run([BASE], new Map([[baseKey(BASE, h), valor]]), 'complete')).toThrow(Error);
  });

  it('existingCounts inválido em chave que não está no lote também lança (valida o mapa inteiro)', () => {
    expect(() => run([BASE], new Map([['h(outra)', -1]]), 'complete')).toThrow(Error);
  });

  it('mode undefined, vazio ou em maiúscula lança Error', () => {
    for (const modo of [undefined, '', 'Complete', 'INCREMENTAL']) {
      expect(() => run([BASE], new Map(), modo as unknown as Mode)).toThrow(Error);
    }
  });

  it('chave de outro lote no mapa não altera o resultado do lote atual', () => {
    const semOutra = run([BASE], new Map([[baseKey(BASE, h), 1]]), 'complete');
    const comOutra = run(
      [BASE],
      new Map([
        [baseKey(BASE, h), 1],
        ['h(["manual","conta-9","2025-01-01",null,5,"outra"])', 99],
      ]),
      'complete',
    );
    expect(comOutra).toEqual(semOutra);
  });

  it('lote com 13 transações iguais e banco com 12: só a 13ª é nova', () => {
    const lote = Array.from({ length: 13 }, () => BASE);
    const r = run(lote, new Map([[baseKey(BASE, h), 12]]), 'complete');
    expect(r.filter((x) => x.isNew).map((x) => x.occurrence)).toEqual([13]);
  });

  it('ocorrência e identityKey são iguais em incremental e em complete para a mesma posição', () => {
    const c = run([BASE, BASE, BASE], new Map(), 'complete')[2];
    const i = run([BASE], new Map([[baseKey(BASE, h), 2]]), 'incremental')[0];
    expect(c?.occurrence).toBe(3);
    expect(i?.identityKey).toBe(c?.identityKey);
  });

  it('identityKey é o hash do JSON de [bk, n]', () => {
    expect(identityKey('k', 1, identidade)).toBe(JSON.stringify(['k', 1]));
    expect(identityKey('k', 1, h)).toBe('h(["k",1])');
  });

  it('incremental não é idempotente por desenho: repetir o lote cria de novo (registrado, não é bug)', () => {
    const primeira = run([BASE], new Map(), 'incremental');
    const segunda = run([BASE], new Map([[baseKey(BASE, h), 1]]), 'incremental');
    expect(primeira[0]?.occurrence).toBe(1);
    expect(segunda[0]?.occurrence).toBe(2);
  });
});

describe('QA T1.3: ataques de borda', () => {
  it('mesma descrição normalizada, mas source diferente, não mescla', () => {
    const a = tx({ source: 'manual', description: 'Mercado' });
    const b = tx({ source: 'open_finance', description: 'MERCADO' });
    expect(baseKey(a, h)).not.toBe(baseKey(b, h));
  });

  it('um lote com duas contas conta cada uma separadamente', () => {
    const lote = [
      tx({ accountRef: 'conta-1' }),
      tx({ accountRef: 'conta-2' }),
      tx({ accountRef: 'conta-1' }),
    ];
    const r = run(lote, new Map(), 'complete');
    expect(r.map((x) => x.occurrence)).toEqual([1, 1, 2]);
  });

  it('campos fora da identidade (status, type, postedAt, externalId, merchantName) não criam linha nova', () => {
    const original = tx({});
    const variantes = [
      tx({ status: 'pending' }),
      tx({ type: 'income' }),
      tx({ postedAt: '2030-01-01' }),
      tx({ externalId: 'outro' }),
      tx({ merchantName: 'Outra' }),
    ];
    const counts = new Map([[baseKey(original, h), 1]]);
    for (const v of variantes) {
      expect(run([v], counts, 'complete')[0]?.isNew).toBe(false);
    }
  });

  it('mesma data e descrição com valor de sinal oposto não colidem', () => {
    const r = run([tx({ amount: cents(-830) }), tx({ amount: cents(830) })], new Map(), 'complete');
    expect(r.map((x) => x.occurrence)).toEqual([1, 1]);
    expect(r[0]?.identityKey).not.toBe(r[1]?.identityKey);
  });

  it('lote com 1000 transações iguais: ocorrências vão de 1 a 1000 sem repetir', () => {
    const lote = Array.from({ length: 1000 }, () => BASE);
    const r = run(lote, new Map(), 'complete');
    expect(r.at(-1)?.occurrence).toBe(1000);
    expect(new Set(r.map((x) => x.identityKey)).size).toBe(1000);
  });

  it.fails(
    'BUG-T1.3-02: ocorrências acima de 2^53 não colidem (identityKey distinta por ocorrência)',
    () => {
      // existente = 2^53 - 2; incremental de 3 iguais: ocorrências 2^53-1, 2^53 e 2^53+1 (não exato, vira 2^53).
      const r = run([BASE, BASE, BASE], new Map([[baseKey(BASE, h), MAX - 1]]), 'incremental');
      expect(new Set(r.map((x) => x.identityKey)).size).toBe(3);
    },
  );

  it('com existente no limite, a primeira ocorrência continua exata', () => {
    const r = run([BASE], new Map([[baseKey(BASE, h), MAX - 1]]), 'incremental');
    expect(r[0]?.occurrence).toBe(MAX);
    expect(r[0]?.isNew).toBe(true);
  });
});
