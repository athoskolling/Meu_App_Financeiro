// QA independente da T1.7 (domain/transfers/detect.ts), ADR-0020 itens 9 a 12, casos F da T1.5,
// e da manutenção (validateTransaction usa daysInMonth de domain/dates, em vez da cópia local).
// Oráculo: regras de elegibilidade escritas aqui (itens 9 e 10), com índices de um calendário
// de referência construído dia a dia. Lotes com semente fixa (sem Math.random, sem relógio:
// o limite de tempo do lote grande vai no terceiro argumento do it).
// Bug conhecido como it.fails:
//   BUG-T1.7-01: o desempate usa baseKeyInput + externalId, que não inclui o tipo. Duas saídas
//   com o mesmo texto canônico (uma transfer, outra expense) empatam e o índice decide. Resultado
//   e confiança mudam com a ordem da entrada, contra o item 11 da ADR-0020.
// Não alterar os testes do dev nem o código de domain/ aqui.
import { describe, expect, it } from 'vitest';
import type { Cents } from '../../domain/money';
import { detectTransfers, type TransferMatch } from '../../domain/transfers';
import {
  validateTransaction,
  type NormalizedTransaction,
  type TransactionType,
} from '../../domain/transactions';

const S = 'santander';
const N = 'nubank';
const C = 'cartao';
const OTHER = 'banco-c';
const MATCHABLE: readonly TransactionType[] = ['transfer', 'expense', 'income', 'other'];
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

// Calendário de referência 1900-01-01 .. 2100-12-31, dia a dia (independente do domínio).
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function diasNoMes(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return DIM[m - 1] as number;
}
function fmt(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const DIAS: string[] = [];
{
  let y = 1900;
  let m = 1;
  let d = 1;
  while (y <= 2100) {
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
const IDX = new Map(DIAS.map((dia, i) => [dia, i] as const));
/** Dias de 2026-08-01 a 2026-12-31: a faixa usada pelos lotes aleatórios. */
const JANELA_2026 = DIAS.filter((d) => d >= '2026-08-01' && d <= '2026-12-31');

function tx(
  accountRef: string,
  type: TransactionType,
  amount: number,
  date = '2026-10-06',
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

const opts = (windowDays: number) => ({ windowDays });

/** Lote aleatório, com valores válidos por tipo. `distinct` troca a descrição por uma única. */
function gerarLote(rng: () => number, n: number, distinct: boolean): NormalizedTransaction[] {
  const lote: NormalizedTransaction[] = [];
  for (let k = 0; k < n; k++) {
    const tipo = rng() < 0.7 ? escolha(rng, MATCHABLE) : escolha(rng, TIPOS);
    const mag = escolha(rng, [5000, 10000, 20000]);
    let amount: number;
    if (tipo === 'expense' || tipo === 'credit_card_purchase') amount = -mag;
    else if (tipo === 'income' || tipo === 'refund') amount = mag;
    else amount = rng() < 0.5 ? -mag : mag;
    if (rng() < 0.03) amount = 0;
    const extra: Partial<NormalizedTransaction> = {};
    if (rng() < 0.3) extra.externalId = `e${Math.floor(rng() * 3)}`;
    if (distinct) extra.description = `desc-${k}`;
    lote.push(tx(escolha(rng, [S, N, C, OTHER]), tipo, amount, escolha(rng, JANELA_2026), extra));
  }
  return lote;
}

/** Oráculo: ADR-0020 itens 9 e 10, sem chamar o domínio. */
function elegivel(o: NormalizedTransaction, i: NormalizedTransaction, janela: number): boolean {
  if (!(o.amount < 0 && MATCHABLE.includes(o.type))) return false;
  if (!(i.amount > 0 && MATCHABLE.includes(i.type))) return false;
  if (o.accountRef === i.accountRef) return false;
  if (o.amount !== -Number(i.amount)) return false;
  const a = IDX.get(o.date);
  const b = IDX.get(i.date);
  if (a === undefined || b === undefined) return false;
  return Math.abs(a - b) <= janela;
}

function diasEntre(o: NormalizedTransaction, i: NormalizedTransaction): number {
  return Math.abs((IDX.get(o.date) ?? 0) - (IDX.get(i.date) ?? 0));
}

/** Problemas de um resultado, segundo o oráculo. Lista vazia = ok. */
function problemasDo(
  lote: readonly NormalizedTransaction[],
  res: readonly TransferMatch[],
  janela: number,
): string[] {
  const p: string[] = [];
  const outs = res.map((m) => m.outflowIndex);
  const ins = res.map((m) => m.inflowIndex);
  if (new Set(outs).size !== outs.length) p.push('saída repetida');
  if (new Set(ins).size !== ins.length) p.push('entrada repetida');
  for (let k = 1; k < res.length; k++) {
    if ((res[k - 1]?.outflowIndex ?? 0) >= (res[k]?.outflowIndex ?? 0)) p.push('fora de ordem');
  }
  for (const m of res) {
    const o = lote[m.outflowIndex] as NormalizedTransaction;
    const i = lote[m.inflowIndex] as NormalizedTransaction;
    if (!elegivel(o, i, janela)) p.push('par não elegível');
    if (m.daysApart !== diasEntre(o, i) || m.daysApart > janela || m.daysApart < 0) {
      p.push('daysApart errado');
    }
    const alta = o.type === 'transfer' && i.type === 'transfer' && m.daysApart <= 1;
    if (m.confidence !== (alta ? 'high' : 'medium')) p.push('confiança errada');
  }
  const usadaO = new Set(outs);
  const usadaI = new Set(ins);
  for (let a = 0; a < lote.length; a++) {
    for (let b = 0; b < lote.length; b++) {
      if (elegivel(lote[a] as NormalizedTransaction, lote[b] as NormalizedTransaction, janela)) {
        if (!usadaO.has(a) && !usadaI.has(b)) p.push(`não maximal: ${a}-${b}`);
      }
    }
  }
  return p;
}

/** Conteúdo de cada par, sem índices: para comparar entradas permutadas. */
function conteudo(lote: readonly NormalizedTransaction[], res: readonly TransferMatch[]): string[] {
  return res
    .map((m) =>
      JSON.stringify([lote[m.outflowIndex], lote[m.inflowIndex], m.daysApart, m.confidence]),
    )
    .sort();
}

describe('QA T1.7: propriedades com semente fixa (ADR-0020 itens 9 a 12)', () => {
  it('nenhum índice aparece em dois pares; todo par é elegível e tem daysApart e confiança corretos', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const rng = prng(seed);
      const lote = gerarLote(rng, Math.floor(rng() * 15), false);
      const janela = escolha(rng, [0, 1, 2, 3, 5]);
      const res = detectTransfers(lote, opts(janela));
      for (const p of problemasDo(lote, res, janela)) {
        if (!p.startsWith('não maximal')) problemas.push(`semente ${seed}: ${p}`);
      }
    }
    expect(problemas.slice(0, 5)).toEqual([]);
  });

  it('resultado maximal: nenhum par elegível sobra com as duas pernas livres', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const rng = prng(seed * 7);
      const lote = gerarLote(rng, Math.floor(rng() * 15), false);
      const janela = escolha(rng, [0, 1, 2, 3, 5]);
      const res = detectTransfers(lote, opts(janela));
      for (const p of problemasDo(lote, res, janela)) {
        if (p.startsWith('não maximal')) problemas.push(`semente ${seed}: ${p}`);
      }
    }
    expect(problemas.slice(0, 5)).toEqual([]);
  });

  it('permutar a entrada não muda o conjunto de pares, em termos de conteúdo (descrições distintas)', () => {
    const problemas: string[] = [];
    for (let seed = 1; seed <= 200; seed++) {
      const rng = prng(seed * 11);
      const lote = gerarLote(rng, Math.floor(rng() * 14), true);
      const janela = escolha(rng, [1, 2, 3]);
      const ref = conteudo(lote, detectTransfers(lote, opts(janela)));
      for (let rep = 0; rep < 3; rep++) {
        const ordem = lote.map((_, k) => k);
        for (let k = ordem.length - 1; k > 0; k--) {
          const j = Math.floor(rng() * (k + 1));
          const tmp = ordem[k] as number;
          ordem[k] = ordem[j] as number;
          ordem[j] = tmp;
        }
        const emb = ordem.map((k) => lote[k] as NormalizedTransaction);
        if (
          JSON.stringify(conteudo(emb, detectTransfers(emb, opts(janela)))) !== JSON.stringify(ref)
        ) {
          problemas.push(`semente ${seed}, rep ${rep}`);
        }
      }
    }
    expect(problemas).toEqual([]);
  });

  it('é determinístico: a mesma entrada dá o mesmo resultado', () => {
    const lote = gerarLote(prng(555), 12, true);
    expect(detectTransfers(lote, opts(2))).toEqual(detectTransfers(lote, opts(2)));
  });

  it('o resultado vem ordenado por outflowIndex e nunca tem daysApart negativo', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = prng(seed * 13);
      const lote = gerarLote(rng, 12, true);
      const res = detectTransfers(lote, opts(3));
      for (const m of res) expect(m.daysApart).toBeGreaterThanOrEqual(0);
      const outs = res.map((m) => m.outflowIndex);
      expect([...outs].sort((a, b) => a - b)).toEqual(outs);
    }
  });
});

describe('QA T1.7: casos de borda', () => {
  it('windowDays 0 aceita só o mesmo dia; um dia de diferença não casa', () => {
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2026-10-06'), tx(N, 'transfer', 100, '2026-10-06')],
        opts(0),
      ),
    ).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 0, confidence: 'high' }]);
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2026-10-06'), tx(N, 'transfer', 100, '2026-10-07')],
        opts(0),
      ),
    ).toEqual([]);
  });

  it('lote vazio com windowDays 0 dá vazio', () => {
    expect(detectTransfers([], opts(0))).toEqual([]);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'windowDays %s lança Error',
    (w) => {
      expect(() => detectTransfers([], opts(w))).toThrow(Error);
    },
  );

  it('windowDays que não é número lança Error', () => {
    expect(() => detectTransfers([], { windowDays: '2' as unknown as number })).toThrow(Error);
    expect(() => detectTransfers([], {} as unknown as { windowDays: number })).toThrow(Error);
  });

  it('a mensagem de windowDays inválido não ecoa o valor', () => {
    let msg = '';
    try {
      detectTransfers([], opts(-4242));
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).not.toMatch(/\d/);
  });

  it('anos bissextos: 2028-02-29 e 2024-02-29 entram na conta de dias (daysApart 1 e 2)', () => {
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2028-02-28'), tx(N, 'transfer', 100, '2028-02-29')],
        opts(1),
      ),
    ).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 1, confidence: 'high' }]);
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2024-02-28'), tx(N, 'transfer', 100, '2024-03-01')],
        opts(2),
      ),
    ).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 2, confidence: 'medium' }]);
  });

  it('2100 não é bissexto: 2100-02-28 e 2100-03-01 ficam a 1 dia', () => {
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2100-02-28'), tx(N, 'transfer', 100, '2100-03-01')],
        opts(1),
      ),
    ).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 1, confidence: 'high' }]);
  });

  it('2000 é bissexto: 2000-02-28 e 2000-03-01 ficam a 2 dias (não a 1)', () => {
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2000-02-28'), tx(N, 'transfer', 100, '2000-03-01')],
        opts(1),
      ),
    ).toEqual([]);
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100, '2000-02-28'), tx(N, 'transfer', 100, '2000-03-01')],
        opts(2),
      ),
    ).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 2, confidence: 'medium' }]);
  });

  it('desempate por externalId: texto canônico menor vence (ADR item 11)', () => {
    // Mesmo texto de data e valor; só o externalId muda o texto canônico ("a" < "b").
    const lote = [
      tx(S, 'transfer', -100, '2026-10-06', { externalId: 'b' }),
      tx(S, 'transfer', -100, '2026-10-06', { externalId: 'a' }),
      tx(N, 'transfer', 100, '2026-10-06'),
    ];
    const r = detectTransfers(lote, opts(0));
    expect(r.map((m) => m.outflowIndex)).toEqual([1]);
  });

  it('três contas: o par sai pela regra de texto canônico, mesmo trocando as posições dos índices', () => {
    const ordem1 = [
      tx(S, 'transfer', -10000),
      tx(N, 'transfer', 10000),
      tx(OTHER, 'transfer', 10000),
    ];
    const ordem2 = [
      tx(S, 'transfer', -10000),
      tx(OTHER, 'transfer', 10000),
      tx(N, 'transfer', 10000),
    ];
    const r1 = detectTransfers(ordem1, opts(2));
    const r2 = detectTransfers(ordem2, opts(2));
    expect(r1).toEqual([{ outflowIndex: 0, inflowIndex: 2, daysApart: 0, confidence: 'high' }]);
    expect(r2).toEqual([{ outflowIndex: 0, inflowIndex: 1, daysApart: 0, confidence: 'high' }]);
    // Em conteúdo, nos dois casos a entrada vencedora é a de OTHER.
    expect((ordem1[r1[0]?.inflowIndex ?? 0] as NormalizedTransaction).accountRef).toBe(OTHER);
    expect((ordem2[r2[0]?.inflowIndex ?? 0] as NormalizedTransaction).accountRef).toBe(OTHER);
  });

  it('valor zero nunca casa, nem com outro zero nem com entrada de valor oposto zero', () => {
    expect(
      detectTransfers([tx(S, 'transfer', 0), tx(N, 'transfer', 0), tx(C, 'transfer', 0)], opts(5)),
    ).toEqual([]);
  });

  it('mesma conta com vários valores não casa consigo mesma', () => {
    expect(
      detectTransfers(
        [tx(S, 'transfer', -100), tx(S, 'transfer', 100), tx(S, 'other', 100)],
        opts(5),
      ),
    ).toEqual([]);
  });

  it('tipos fora da lista não casam nem como saída nem como entrada', () => {
    const fora: TransactionType[] = [
      'credit_card_purchase',
      'credit_card_payment',
      'refund',
      'investment',
    ];
    for (const tipo of fora) {
      expect(detectTransfers([tx(S, tipo, -100), tx(N, 'transfer', 100)], opts(2))).toEqual([]);
      expect(detectTransfers([tx(S, 'transfer', -100), tx(N, tipo, 100)], opts(2))).toEqual([]);
    }
  });
});

describe('QA T1.7: ataques de tamanho e tempo (limite de tempo no terceiro argumento do it)', () => {
  it('lote de 2000 linhas aleatórias termina dentro do limite e mantém as propriedades', () => {
    const rng = prng(2000);
    const lote = gerarLote(rng, 2000, true);
    const res = detectTransfers(lote, opts(2));
    const outs = res.map((m) => m.outflowIndex);
    expect(new Set(outs).size).toBe(outs.length);
    expect(res.length).toBeGreaterThan(0);
  }, 5000);

  it('pior caso: 1000 saídas e 1000 entradas, todas do mesmo valor e data, terminam dentro do limite', () => {
    const lote: NormalizedTransaction[] = [];
    for (let k = 0; k < 1000; k++)
      lote.push(tx(S, 'transfer', -10000, '2026-10-06', { description: `s${k}` }));
    for (let k = 0; k < 1000; k++)
      lote.push(tx(N, 'transfer', 10000, '2026-10-06', { description: `n${k}` }));
    const res = detectTransfers(lote, opts(0));
    expect(res).toHaveLength(1000);
    expect(new Set(res.map((m) => m.inflowIndex)).size).toBe(1000);
  }, 10000);
});

describe('QA T1.7: BUG-T1.7-01 (empate do texto canônico com tipos diferentes)', () => {
  it.fails(
    'BUG-T1.7-01: duas saídas com o mesmo texto canônico dão o mesmo par, com a mesma confiança, em qualquer ordem',
    () => {
      // A: transfer -10000 em S; B: expense -10000 em S. Mesmo texto (o tipo não entra no texto).
      // Ordem [A, B, entrada]: A casa com alta confiança ("high"). Ordem [B, A, entrada]: B casa, "medium".
      const A = tx(S, 'transfer', -10000, '2026-10-06');
      const B = tx(S, 'expense', -10000, '2026-10-06');
      const E = tx(N, 'transfer', 10000, '2026-10-06');
      const ordem1 = [A, B, E];
      const ordem2 = [B, A, E];
      expect(conteudo(ordem1, detectTransfers(ordem1, opts(0)))).toEqual(
        conteudo(ordem2, detectTransfers(ordem2, opts(0))),
      );
    },
  );
});

describe('QA T1.7: manutenção (validateTransaction com daysInMonth de domain/dates)', () => {
  const base = tx(S, 'expense', -830);

  it('validateTransaction aceita exatamente os dias do calendário de referência, de 1900 a 2100', () => {
    const erros: string[] = [];
    for (const dia of DIAS) {
      const ok = validateTransaction({ ...base, date: dia }).problems.every(
        (p) => p.code !== 'invalid_date',
      );
      if (!ok) erros.push(`${dia} rejeitado`);
    }
    expect(erros.slice(0, 5)).toEqual([]);
  });

  it('validateTransaction rejeita o dia seguinte ao último de cada mês de 1900 a 2100', () => {
    const erros: string[] = [];
    const ultimos = new Map<string, string>();
    for (const dia of DIAS) ultimos.set(dia.slice(0, 7), dia);
    for (const ultimo of ultimos.values()) {
      const y = Number(ultimo.slice(0, 4));
      const m = Number(ultimo.slice(5, 7));
      const d = Number(ultimo.slice(8, 10));
      if (d !== diasNoMes(y, m)) erros.push(`${ultimo} inconsistente`);
      const seguinte = d + 1;
      const r = validateTransaction({
        ...base,
        date: `${ultimo.slice(0, 8)}${String(seguinte).padStart(2, '0')}`,
      });
      if (!r.problems.some((p) => p.code === 'invalid_date')) erros.push(`${ultimo}+1 aceito`);
    }
    expect(erros.slice(0, 5)).toEqual([]);
  });

  it.each([
    '0000-01-01',
    '0000-02-29',
    '9999-02-29',
    '2026-02-29',
    '2026-02-30',
    '2026-00-10',
    '2026-13-01',
    '2026-10-00',
    '2026-1-06',
    '',
  ])('data %j é rejeitada como invalid_date sem lançar exceção', (valor) => {
    const r = validateTransaction({ ...base, date: valor });
    expect(r.problems.some((p) => p.code === 'invalid_date')).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('validateTransaction não lança para nenhuma data em formato de texto arbitrário', () => {
    const rng = prng(31337);
    const alfa = '0123456789-:/ x';
    for (let k = 0; k < 3000; k++) {
      let s = '';
      const n = Math.floor(rng() * 12);
      for (let c = 0; c < n; c++) s += alfa.charAt(Math.floor(rng() * alfa.length));
      expect(() => validateTransaction({ ...base, date: s })).not.toThrow();
    }
  });
});
