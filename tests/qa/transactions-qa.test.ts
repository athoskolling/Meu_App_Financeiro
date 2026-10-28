// QA independente da T1.2 (NormalizedTransaction e validateTransaction).
// Dados sintéticos. Sem Date.now(), sem Math.random(): o fuzz usa um PRNG de semente fixa.
// Os testes marcados "BUG-T1.2" documentam falhas reais e ficam vermelhos de propósito
// até o dev corrigir. Não alterar os testes do dev nem o código de domain/ aqui.
import { describe, expect, it } from 'vitest';
import type { Cents } from '../../domain/money';
import {
  validateTransaction,
  type NormalizedTransaction,
  type ProblemCode,
  type TransactionType,
  type ValidationResult,
} from '../../domain/transactions';

const MAX = Number.MAX_SAFE_INTEGER;

const BASE: NormalizedTransaction = {
  source: 'manual',
  accountRef: 'conta-1',
  date: '2026-10-06',
  description: 'Padaria Exemplo',
  amount: -830 as Cents,
  currency: 'BRL',
  type: 'expense',
  status: 'posted',
};

/** Base válida com os campos de `over` sobrescritos (entrada possivelmente hostil). */
function tx(over: Record<string, unknown>): NormalizedTransaction {
  return { ...BASE, ...over };
}

function resultado(entrada: unknown): ValidationResult {
  return validateTransaction(entrada as NormalizedTransaction);
}

function codigos(entrada: unknown): ProblemCode[] {
  return resultado(entrada).problems.map((p) => p.code);
}

const CAMPOS_EM_ORDEM: readonly (keyof NormalizedTransaction)[] = [
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
];

/** Campo e severidade que cada código deve ter (contrato da T1.0, seção B). */
const CAMPO_DO_CODIGO: Record<ProblemCode, keyof NormalizedTransaction> = {
  invalid_source: 'source',
  empty_account_ref: 'accountRef',
  invalid_date: 'date',
  invalid_time: 'time',
  invalid_posted_at: 'postedAt',
  empty_description: 'description',
  invalid_amount: 'amount',
  zero_amount: 'amount',
  sign_mismatch: 'amount',
  invalid_currency: 'currency',
  invalid_type: 'type',
  invalid_status: 'status',
};

const SEVERIDADE_DO_CODIGO: Record<ProblemCode, 'error' | 'warning'> = {
  invalid_source: 'error',
  empty_account_ref: 'error',
  invalid_date: 'error',
  invalid_time: 'error',
  invalid_posted_at: 'error',
  empty_description: 'error',
  invalid_amount: 'error',
  zero_amount: 'warning',
  sign_mismatch: 'error',
  invalid_currency: 'error',
  invalid_type: 'error',
  invalid_status: 'error',
};

const TIPOS: TransactionType[] = [
  'income',
  'expense',
  'transfer',
  'credit_card_purchase',
  'credit_card_payment',
  'refund',
  'investment',
  'other',
];

/** Sinal esperado pela T1.0 (seção B), escrito de novo aqui como oráculo independente. */
function sinalEsperado(tipo: TransactionType, valor: number): ProblemCode[] {
  if (valor === 0) return ['zero_amount'];
  if (tipo === 'expense' || tipo === 'credit_card_purchase') {
    return valor > 0 ? ['sign_mismatch'] : [];
  }
  if (tipo === 'income' || tipo === 'refund') {
    return valor < 0 ? ['sign_mismatch'] : [];
  }
  return [];
}

// --- Oráculos e gerador determinístico --------------------------------------

function pad(n: number, largura: number): string {
  return String(n).padStart(largura, '0');
}

/** Data civil válida, por calendário do JS (oráculo, não a implementação). */
function oraculoDataCivil(s: string): boolean {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s)) return false;
  const ano = Number(s.slice(0, 4));
  const mes = Number(s.slice(5, 7));
  const dia = Number(s.slice(8, 10));
  if (ano < 1) return false;
  const dt = new Date(0);
  dt.setUTCFullYear(ano, mes - 1, dia);
  return dt.getUTCFullYear() === ano && dt.getUTCMonth() === mes - 1 && dt.getUTCDate() === dia;
}

function oraculoHora(s: string): boolean {
  if (!/^[0-9]{2}:[0-9]{2}$/.test(s)) return false;
  return Number(s.slice(0, 2)) <= 23 && Number(s.slice(3, 5)) <= 59;
}

/** PRNG mulberry32: mesma semente, mesma sequência, em qualquer execução. */
type Rnd = () => number;
function prng(semente: number): Rnd {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escolhe<T>(rnd: Rnd, opcoes: readonly T[]): T {
  return opcoes[Math.floor(rnd() * opcoes.length)] as T;
}

function dataCivilAleatoriaValida(rnd: Rnd): string {
  for (;;) {
    const s = `${pad(1900 + Math.floor(rnd() * 201), 4)}-${pad(1 + Math.floor(rnd() * 12), 2)}-${pad(
      1 + Math.floor(rnd() * 31),
      2,
    )}`;
    if (oraculoDataCivil(s)) return s;
  }
}

// --- Listas de casos (valores e códigos fixados à mão) ----------------------

const DATAS_VALIDAS = [
  '2026-10-06',
  '2026-01-31',
  '2026-02-28',
  '2026-10-31',
  '2028-02-29',
  '2000-02-29',
  '1600-02-29',
  '2400-02-29',
  '1900-01-01',
  '2100-12-31',
  '0001-01-01',
  '9999-12-31',
];

const DATAS_INVALIDAS = [
  '0000-01-01',
  '0000-02-29',
  '2026-02-29',
  '2027-02-29',
  '2100-02-29',
  '1900-02-29',
  '2026-02-30',
  '2026-04-31',
  '2026-06-31',
  '2026-09-31',
  '2026-11-31',
  '2026-13-01',
  '2026-00-10',
  '2026-10-00',
  '2026-10-32',
  '2026-1-05',
  '2026-10-6',
  '2026/10/06',
  '20261006',
  '2026-010-06',
  '026-10-06',
  '02026-10-06',
  '2026-10-06T00:00',
  '2026-10-06T00:00:00Z',
  '2026-10-06 ',
  ' 2026-10-06',
  '+2026-10-06',
  '-2026-10-06',
  '2026-10-06\n',
  '2026-10-06\r\n',
  '2026-10-06\u0000',
  '２026-10-06',
  '2026-１０-06',
  '2026-١٠-06',
  '',
  ' ',
];

const HORAS_VALIDAS = ['00:00', '09:05', '12:00', '23:59'];

const HORAS_INVALIDAS = [
  '24:00',
  '23:60',
  '99:99',
  '9:05',
  '09:5',
  '0905',
  '09-05',
  '09:05:00',
  ' 09:05',
  '09:05 ',
  '09:05\n',
  '+9:05',
  '-1:00',
  '٠٩:٠٥',
  '09:05\u0000',
  '',
  'ab:cd',
];

/** Valores que não são inteiro seguro: todos devem dar só invalid_amount. */
const VALORES_NAO_INTEIROS_SEGUROS: [string, unknown][] = [
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['-Infinity', -Infinity],
  ['2**53', 2 ** 53],
  ['-(2**53)', -(2 ** 53)],
  ['2**53+2', 2 ** 53 + 2],
  ['12.5', 12.5],
  ['-12.5', -12.5],
  ['0.1', 0.1],
  ['1e-300', 1e-300],
  ['Number.MIN_VALUE', Number.MIN_VALUE],
  ['string "830"', '830'],
  ['string "-830"', '-830'],
  ['string vazia', ''],
  ['null', null],
  ['undefined', undefined],
  ['bigint 830n', 830n],
  ['objeto Number(-830)', Object(-830)],
  ['array [-830]', [-830]],
  ['booleano true', true],
];

const VALORES_INTEIROS: number[] = [1, -1, 2, -2, 830, -830, MAX, -MAX, 0, -0];

const TIPOS_DESCONHECIDOS: [string, unknown][] = [
  ['vazio', ''],
  ['caixa diferente', 'Expense'],
  ['caixa alta', 'EXPENSE'],
  ['espaço no fim', 'expense '],
  ['português', 'gasto'],
  ['nome de propriedade do Object', 'constructor'],
  ['__proto__ como string', '__proto__'],
  ['toString como string', 'toString'],
  ['nulo', null],
  ['indefinido', undefined],
  ['número', 1],
  ['booleano', true],
  ['símbolo', Symbol('expense')],
  ['objeto vazio', {}],
  ['array com o tipo', ['expense']],
  ['objeto String com o tipo', Object('expense')],
];

const TEXTOS_EM_BRANCO: [string, string][] = [
  ['vazio', ''],
  ['um espaço', ' '],
  ['tab', '\t'],
  ['quebra de linha', '\n'],
  ['CRLF', '\r\n'],
  ['espaço não separável U+00A0', ' '],
  ['espaço ideográfico U+3000', '　'],
  ['espaço em quad U+2003', ' '],
  ['BOM U+FEFF', '﻿'],
];

// --- Testes ------------------------------------------------------------------

describe('QA T1.2: data civil', () => {
  it('aceita exatamente os dias do calendário de 1900 a 2100 (73414 dias) e recusa os demais', () => {
    const divergencias: string[] = [];
    let aceitas = 0;
    for (let ano = 1900; ano <= 2100; ano++) {
      for (let mes = 0; mes <= 13; mes++) {
        for (let dia = 0; dia <= 32; dia++) {
          const s = `${pad(ano, 4)}-${pad(mes, 2)}-${pad(dia, 2)}`;
          const esperado = oraculoDataCivil(s);
          const recusada = codigos(tx({ date: s })).includes('invalid_date');
          if (esperado) aceitas++;
          if (recusada === esperado) divergencias.push(s);
        }
      }
    }
    expect(divergencias).toEqual([]);
    expect(aceitas).toBe(73414);
  });

  it.each(DATAS_VALIDAS)('data civil válida %s não gera problema de data', (data) => {
    expect(codigos(tx({ date: data }))).toEqual([]);
  });

  it.each(DATAS_INVALIDAS)('data inválida %j vira só invalid_date', (data) => {
    expect(codigos(tx({ date: data }))).toEqual(['invalid_date']);
  });

  it('data com 100 mil caracteres extras é recusada sem lançar e sem estourar tempo', () => {
    expect(codigos(tx({ date: `2026-10-06${'x'.repeat(100000)}` }))).toEqual(['invalid_date']);
  });

  it('fuzz de datas aleatórias: o resultado bate com o oráculo (ASCII, sinais, unicode, quebras)', () => {
    const rnd = prng(20261006);
    const alfabeto = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '-',
      ':',
      'T',
      ' ',
      '\n',
      '١',
      '２',
    ];
    const divergencias: string[] = [];
    for (let i = 0; i < 5000; i++) {
      const tamanho = Math.floor(rnd() * 14);
      let s = '';
      for (let k = 0; k < tamanho; k++) s += escolhe(rnd, alfabeto);
      // Também testa o formato quase certo, para que os casos de calendário sejam exercitados.
      if (i % 2 === 0) {
        s = `${pad(Math.floor(rnd() * 10000), 4)}-${pad(Math.floor(rnd() * 15), 2)}-${pad(Math.floor(rnd() * 33), 2)}`;
      }
      const recusada = codigos(tx({ date: s })).includes('invalid_date');
      if (recusada === oraculoDataCivil(s)) divergencias.push(JSON.stringify(s));
    }
    expect(divergencias).toEqual([]);
  });

  it('ano bissexto: 2000 e 1600 e 2400 são bissextos; 1900, 2100 e 2026 não são', () => {
    expect(codigos(tx({ date: '2000-02-29' }))).toEqual([]);
    expect(codigos(tx({ date: '1600-02-29' }))).toEqual([]);
    expect(codigos(tx({ date: '2400-02-29' }))).toEqual([]);
    expect(codigos(tx({ date: '1900-02-29' }))).toEqual(['invalid_date']);
    expect(codigos(tx({ date: '2100-02-29' }))).toEqual(['invalid_date']);
    expect(codigos(tx({ date: '2026-02-29' }))).toEqual(['invalid_date']);
  });
});

describe('QA T1.2: hora e postedAt', () => {
  it('toda hora HH:mm de 00:00 a 23:59 é aceita; as demais (00 a 99 por 00 a 99) são recusadas', () => {
    const divergencias: string[] = [];
    for (let h = 0; h <= 99; h++) {
      for (let m = 0; m <= 99; m++) {
        const s = `${pad(h, 2)}:${pad(m, 2)}`;
        const recusada = codigos(tx({ time: s })).includes('invalid_time');
        if (recusada === oraculoHora(s)) divergencias.push(s);
      }
    }
    expect(divergencias).toEqual([]);
  });

  it.each(HORAS_VALIDAS)('hora %s é aceita', (hora) => {
    expect(codigos(tx({ time: hora }))).toEqual([]);
  });

  it.each(HORAS_INVALIDAS)('hora inválida %j vira só invalid_time', (hora) => {
    expect(codigos(tx({ time: hora }))).toEqual(['invalid_time']);
  });

  it('time ausente (undefined) não gera problema; null e número gera invalid_time', () => {
    expect(codigos(tx({ time: undefined }))).toEqual([]);
    expect(codigos(tx({ time: null }))).toEqual(['invalid_time']);
    expect(codigos(tx({ time: 905 }))).toEqual(['invalid_time']);
  });

  it('postedAt segue a mesma regra de data civil e é opcional', () => {
    expect(codigos(tx({ postedAt: undefined }))).toEqual([]);
    for (const d of DATAS_VALIDAS) expect(codigos(tx({ postedAt: d }))).toEqual([]);
    for (const d of DATAS_INVALIDAS.slice(0, 20)) {
      expect(codigos(tx({ postedAt: d }))).toEqual(['invalid_posted_at']);
    }
    expect(codigos(tx({ postedAt: null }))).toEqual(['invalid_posted_at']);
    expect(codigos(tx({ postedAt: '2026-02-29' }))).toEqual(['invalid_posted_at']);
  });
});

describe('QA T1.2: valor (inteiro seguro, sinal e zero)', () => {
  it.each(VALORES_NAO_INTEIROS_SEGUROS)(
    'valor %s dá só invalid_amount, em todos os tipos (sem sign_mismatch)',
    (_rotulo, valor) => {
      const divergencias: string[] = [];
      for (const tipo of TIPOS) {
        const cods = codigos(tx({ type: tipo, amount: valor }));
        if (JSON.stringify(cods) !== '["invalid_amount"]')
          divergencias.push(`${tipo}: ${cods.join(',')}`);
      }
      expect(divergencias).toEqual([]);
    },
  );

  it('sinal por tipo: a matriz tipo x valor bate com a T1.0 (inclui ±2**53-1, zero e -0)', () => {
    const divergencias: string[] = [];
    for (const tipo of TIPOS) {
      for (const valor of VALORES_INTEIROS) {
        const obtido = codigos(tx({ type: tipo, amount: valor }));
        const esperado = sinalEsperado(tipo, valor);
        if (JSON.stringify(obtido) !== JSON.stringify(esperado)) {
          divergencias.push(
            `${tipo} ${String(valor)}: obtido ${obtido.join(',')}, esperado ${esperado.join(',')}`,
          );
        }
      }
    }
    expect(divergencias).toEqual([]);
  });

  it('-0 é tratado como zero: só zero_amount (aviso), sem sign_mismatch, ok verdadeiro', () => {
    for (const tipo of TIPOS) {
      const r = resultado(tx({ type: tipo, amount: -0 }));
      expect(r.problems.map((p) => p.code)).toEqual(['zero_amount']);
      expect(r.ok).toBe(true);
    }
  });

  it('valor zero com tipo desconhecido: zero_amount (aviso) vem antes de invalid_type (erro), e ok é falso', () => {
    const r = resultado(tx({ type: 'gasto', amount: 0 }));
    expect(r.problems.map((p) => p.code)).toEqual(['zero_amount', 'invalid_type']);
    expect(r.ok).toBe(false);
  });

  it('±(2**53 - 1) passa pela regra de sinal como qualquer inteiro seguro', () => {
    expect(codigos(tx({ type: 'expense', amount: MAX }))).toEqual(['sign_mismatch']);
    expect(codigos(tx({ type: 'expense', amount: -MAX }))).toEqual([]);
    expect(codigos(tx({ type: 'income', amount: MAX }))).toEqual([]);
    expect(codigos(tx({ type: 'income', amount: -MAX }))).toEqual(['sign_mismatch']);
  });
});

describe('QA T1.2: tipo, status, fonte e moeda desconhecidos', () => {
  it.each(TIPOS_DESCONHECIDOS)(
    'tipo %s vira só invalid_type, sem sign_mismatch',
    (_rotulo, tipo) => {
      expect(codigos(tx({ type: tipo, amount: -830 }))).toEqual(['invalid_type']);
      expect(codigos(tx({ type: tipo, amount: 830 }))).toEqual(['invalid_type']);
    },
  );

  it.each([
    ['POSTED em caixa alta', 'POSTED'],
    ['posted com espaço', 'posted '],
    ['done', 'done'],
    ['vazio', ''],
    ['nulo', null],
    ['indefinido', undefined],
    ['número', 1],
    ['objeto String', Object('posted')],
  ])('status %s vira invalid_status', (_rotulo, status) => {
    expect(codigos(tx({ status }))).toEqual(['invalid_status']);
  });

  it.each([
    ['OPEN_FINANCE em caixa alta', 'OPEN_FINANCE'],
    ['manual com espaço', 'manual '],
    ['csv', 'csv'],
    ['vazio', ''],
    ['nulo', null],
    ['indefinido', undefined],
    ['array', ['manual']],
    ['objeto String', Object('manual')],
  ])('fonte %s vira invalid_source', (_rotulo, source) => {
    expect(codigos(tx({ source }))).toEqual(['invalid_source']);
  });

  it.each([
    ['brl minúsculo', 'brl'],
    ['BRL com espaço', 'BRL '],
    ['R$', 'R$'],
    ['USD', 'USD'],
    ['vazio', ''],
    ['nulo', null],
    ['indefinido', undefined],
    ['BRL com byte nulo', 'BRL\u0000'],
    ['objeto String', Object('BRL')],
  ])('moeda %s vira invalid_currency', (_rotulo, currency) => {
    expect(codigos(tx({ currency }))).toEqual(['invalid_currency']);
  });
});

describe('QA T1.2: textos vazios e não-string', () => {
  it.each(TEXTOS_EM_BRANCO)(
    'descrição com %s é empty_description (erro)',
    (_rotulo, description) => {
      const r = resultado(tx({ description }));
      expect(r.ok).toBe(false);
      expect(r.problems).toEqual([
        { code: 'empty_description', field: 'description', severity: 'error' },
      ]);
    },
  );

  it.each(TEXTOS_EM_BRANCO)('conta com %s é empty_account_ref', (_rotulo, accountRef) => {
    expect(codigos(tx({ accountRef }))).toEqual(['empty_account_ref']);
  });

  it.each([
    ['nulo', null],
    ['indefinido', undefined],
    ['número', 42],
    ['array', ['Padaria']],
  ])('descrição %s (não-string) vira empty_description, sem lançar', (_rotulo, description) => {
    expect(codigos(tx({ description }))).toEqual(['empty_description']);
  });

  it('um texto com conteúdo real e espaços nas pontas não é vazio', () => {
    expect(codigos(tx({ description: '  Padaria  ' }))).toEqual([]);
    expect(codigos(tx({ accountRef: '  conta-1  ' }))).toEqual([]);
  });
});

describe('QA T1.2: entradas hostis que não devem lançar', () => {
  it('objeto sem campos devolve os 8 problemas obrigatórios, na ordem do contrato, e não lança', () => {
    expect(codigos({})).toEqual([
      'invalid_source',
      'empty_account_ref',
      'invalid_date',
      'empty_description',
      'invalid_amount',
      'invalid_currency',
      'invalid_type',
      'invalid_status',
    ]);
  });

  it('array vazio devolve os mesmos 8 problemas e não lança', () => {
    expect(codigos([])).toEqual(codigos({}));
  });

  it('objeto com campos extras (itemId, JSON bruto) é ignorado e não gera problema', () => {
    expect(resultado(tx({ itemId: 'item-x', raw: { secreto: 1 }, extra: 2 }))).toEqual({
      ok: true,
      problems: [],
    });
  });

  it('não chama toString, valueOf nem Symbol.toPrimitive de nenhum campo', () => {
    let chamadas = 0;
    const espiao = {
      toString() {
        chamadas++;
        return 'expense';
      },
      valueOf() {
        chamadas++;
        return -830;
      },
      [Symbol.toPrimitive]() {
        chamadas++;
        return 'x';
      },
    };
    resultado(
      tx({
        source: espiao,
        accountRef: espiao,
        date: espiao,
        time: espiao,
        postedAt: espiao,
        description: espiao,
        amount: espiao,
        currency: espiao,
        type: espiao,
        status: espiao,
      }),
    );
    expect(chamadas).toBe(0);
  });

  it('não faz nenhuma escrita no objeto (Proxy registra set, defineProperty, deleteProperty)', () => {
    const escritas: string[] = [];
    const proxy = new Proxy(BASE, {
      set(_alvo, chave) {
        escritas.push(`set:${String(chave)}`);
        return true;
      },
      defineProperty(_alvo, chave) {
        escritas.push(`define:${String(chave)}`);
        return true;
      },
      deleteProperty(_alvo, chave) {
        escritas.push(`delete:${String(chave)}`);
        return true;
      },
    });
    expect(() => resultado(proxy)).not.toThrow();
    expect(escritas).toEqual([]);
  });

  it('entrada congelada (Object.freeze) não lança e não muda; o resultado é o mesmo nas duas chamadas', () => {
    const congelada = Object.freeze(tx({ amount: 830, date: '2026-02-30' }));
    const primeira = resultado(congelada);
    const segunda = resultado(congelada);
    expect(primeira).toEqual(segunda);
    expect(congelada.amount).toBe(830);
    expect(congelada.date).toBe('2026-02-30');
  });
});

describe('QA T1.2: lançamentos (BUG-T1.2: a função não pode lançar)', () => {
  // Pelo briefing do QA, validateTransaction não pode lançar exceção: a entrada vem de fonte
  // não confiável e o problema deve ser devolvido como problema, não como crash.
  // Falham hoje. Reprodução: `pnpm test tests/qa/transactions-qa.test.ts`.

  it('BUG-T1.2-01: validateTransaction(null) não lança (devolve os problemas)', () => {
    expect(() => resultado(null)).not.toThrow();
  });

  it('BUG-T1.2-02: validateTransaction(undefined) não lança (devolve os problemas)', () => {
    expect(() => resultado(undefined)).not.toThrow();
  });

  it('BUG-T1.2-03: um getter que lança num campo não derruba a validação', () => {
    const hostil: Record<string, unknown> = { ...BASE };
    Object.defineProperty(hostil, 'type', {
      enumerable: true,
      get() {
        throw new Error('getter hostil');
      },
    });
    expect(() => resultado(hostil)).not.toThrow();
  });

  it('BUG-T1.2-04: um Proxy que lança no get não derruba a validação', () => {
    const hostil = new Proxy(BASE, {
      get() {
        throw new Error('proxy hostil');
      },
    });
    expect(() => resultado(hostil)).not.toThrow();
  });
});

describe('QA T1.2: propriedades (fuzz determinístico, 3000 casos)', () => {
  const POOL: Record<keyof NormalizedTransaction, readonly unknown[]> = {
    source: ['open_finance', 'caju_ocr', 'manual', 'csv', ''],
    accountRef: ['conta-1', '', '   '],
    externalId: ['ext-1', undefined],
    date: ['2026-10-06', '2026-02-29', '2028-02-29', '2026-13-01', '2026-10-06\n'],
    time: [undefined, '09:05', '24:00', '9:05'],
    postedAt: [undefined, '2026-10-07', '2026-02-30'],
    description: ['Padaria Exemplo', '', ' '],
    merchantName: [undefined, 'Loja'],
    amount: [-830, 830, 0, -0, 12.5, NaN, MAX, -MAX],
    currency: ['BRL', 'USD'],
    type: [...TIPOS, 'gasto'],
    status: ['pending', 'posted', 'done'],
  };

  function montaAleatoria(rnd: Rnd): Record<string, unknown> {
    const o: Record<string, unknown> = {};
    for (const chave of Object.keys(POOL) as (keyof NormalizedTransaction)[]) {
      const valor = escolhe(rnd, POOL[chave]);
      if (valor !== undefined) o[chave] = valor;
    }
    return o;
  }

  /** Lista de violações de invariantes para uma entrada. Vazia = tudo certo. */
  function violacoes(entrada: Record<string, unknown>): string[] {
    const out: string[] = [];
    const antes = Object.entries(entrada);
    let r: ValidationResult;
    try {
      r = resultado(entrada);
    } catch (e) {
      return [`lançou: ${e instanceof Error ? e.message : 'erro'}`];
    }
    if (r.ok !== !r.problems.some((p) => p.severity === 'error'))
      out.push('ok não bate com a severidade');
    let ultimo = -1;
    const vistos = new Set<string>();
    for (const p of r.problems) {
      if (Object.keys(p).sort().join(',') !== 'code,field,severity')
        out.push('problema com campos extras');
      if (CAMPO_DO_CODIGO[p.code] !== p.field)
        out.push(`código ${p.code} no campo errado ${p.field}`);
      if (SEVERIDADE_DO_CODIGO[p.code] !== p.severity) out.push(`severidade errada em ${p.code}`);
      const idx = CAMPOS_EM_ORDEM.indexOf(p.field);
      if (idx < ultimo) out.push('ordem dos problemas fora do contrato');
      ultimo = idx;
      const chave = `${p.code}|${p.field}`;
      if (vistos.has(chave)) out.push(`problema duplicado ${chave}`);
      vistos.add(chave);
    }
    const cods = r.problems.map((p) => p.code);
    if (cods.includes('invalid_amount') && cods.includes('sign_mismatch')) {
      out.push('invalid_amount e sign_mismatch juntos');
    }
    if (JSON.stringify(resultado(entrada)) !== JSON.stringify(r)) out.push('não é determinística');
    const invertida = Object.fromEntries(Object.entries(entrada).reverse());
    if (JSON.stringify(resultado(invertida)) !== JSON.stringify(r))
      out.push('depende da ordem das chaves');
    const depois = Object.entries(entrada);
    if (
      antes.length !== depois.length ||
      antes.some(([k, v], i) => depois[i]?.[0] !== k || !Object.is(depois[i]?.[1], v))
    ) {
      out.push('entrada mutada');
    }
    return out;
  }

  it('3000 transações aleatórias (campos válidos e inválidos misturados) respeitam todas as invariantes', () => {
    const rnd = prng(0x51ab1e);
    const falhas: string[] = [];
    for (let i = 0; i < 3000; i++) {
      const entrada = montaAleatoria(rnd);
      const v = violacoes(entrada);
      if (v.length > 0) falhas.push(`#${i}: ${v.join('; ')}`);
    }
    expect(falhas).toEqual([]);
  });

  it('2000 transações válidas geradas por regra (data, hora, sinal conforme o tipo) não geram problema', () => {
    const rnd = prng(0xc0ffee);
    const falhas: string[] = [];
    for (let i = 0; i < 2000; i++) {
      const tipo = escolhe(rnd, TIPOS);
      const n = 1 + Math.floor(rnd() * MAX);
      const negativo = tipo === 'expense' || tipo === 'credit_card_purchase';
      const positivo = tipo === 'income' || tipo === 'refund';
      const valor = negativo ? -n : positivo ? n : rnd() < 0.5 ? -n : n;
      const entrada = tx({
        date: dataCivilAleatoriaValida(rnd),
        time: rnd() < 0.5 ? escolhe(rnd, HORAS_VALIDAS) : undefined,
        postedAt: rnd() < 0.5 ? dataCivilAleatoriaValida(rnd) : undefined,
        description: `Lançamento ${String(i)}`,
        amount: valor,
        type: tipo,
      });
      const r = resultado(entrada);
      if (!r.ok || r.problems.length > 0)
        falhas.push(`#${i} ${tipo} ${String(valor)}: ${JSON.stringify(r.problems)}`);
    }
    expect(falhas).toEqual([]);
  });

  it('nenhuma combinação de campos dá invalid_amount e sign_mismatch juntos (a regra de ordem entre eles não tem caso)', () => {
    const rnd = prng(7);
    const juntos: string[] = [];
    for (let i = 0; i < 2000; i++) {
      const cods = codigos(montaAleatoria(rnd));
      if (cods.includes('invalid_amount') && cods.includes('sign_mismatch'))
        juntos.push(cods.join(','));
    }
    expect(juntos).toEqual([]);
  });
});

describe('QA T1.2: pureza e ordem', () => {
  it('mesma entrada, mesma saída, em chamadas repetidas e com chaves em ordem diferente', () => {
    const t = tx({ type: 'income', amount: -500, date: '2026-02-30', description: '' });
    const reversa = Object.fromEntries(Object.entries(t).reverse());
    expect(resultado(t)).toEqual(resultado(t));
    expect(resultado(reversa)).toEqual(resultado(t));
  });

  it('dois problemas no mesmo campo ou em campos vizinhos saem na ordem do contrato, não na de inserção', () => {
    const t = tx({ status: 'done', date: '2026-02-30', source: 'csv' });
    expect(resultado(t).problems.map((p) => p.field)).toEqual(['source', 'date', 'status']);
  });
});
