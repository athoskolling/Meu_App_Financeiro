// QA independente da T1.6 (domain/dates/), ADR-0020 itens 1 e 18, casos D da T1.5.
// Oráculo: uma lista de dias 1900-01-01 .. 2100-12-31 construída dia a dia, sem aritmética
// de época. daysBetween é conferido contra o índice nessa lista, em todos os dias.
// Dados sintéticos. Sem Date, sem Math.random: a amostra usa um PRNG de semente fixa.
import { describe, expect, it } from 'vitest';
import { daysBetween, daysInMonth, monthPeriod } from '../../domain/dates';

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

// Referência independente do calendário: tamanho do mês por tabela e regra gregoriana.
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function diasNoMes(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return DIM[m - 1] as number;
}
function fmt(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Todos os dias de 1900-01-01 a 2100-12-31, em ordem, gerados dia a dia. */
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

describe('QA T1.6 datas: oráculo dia a dia (1900 a 2100)', () => {
  it('a lista de referência tem 73.414 dias (201 anos, 49 bissextos: 1904 a 2096)', () => {
    // 201 anos: 201*365 + 49 = 73414. 1900 e 2100 não são bissextos; 2000 é.
    expect(DIAS).toHaveLength(73414);
    expect(DIAS[0]).toBe('1900-01-01');
    expect(DIAS.at(-1)).toBe('2100-12-31');
  });

  it('daysBetween de dias consecutivos é 1, em todos os dias de 1900 a 2100', () => {
    const erros: string[] = [];
    for (let i = 0; i + 1 < DIAS.length; i++) {
      const got = daysBetween(DIAS[i] as string, DIAS[i + 1] as string);
      if (got !== 1) erros.push(`${i}: ${got}`);
    }
    expect(erros.slice(0, 5)).toEqual([]);
  });

  it('daysBetween(1900-01-01, dia) é o índice do dia, para todos os dias', () => {
    const erros: string[] = [];
    for (let i = 0; i < DIAS.length; i++) {
      const got = daysBetween('1900-01-01', DIAS[i] as string);
      if (got !== i) erros.push(`${DIAS[i]}: ${got} != ${i}`);
    }
    expect(erros.slice(0, 5)).toEqual([]);
  });

  it('daysInMonth bate com a contagem real de dias de cada mês, de 1900 a 2100', () => {
    const contagem = new Map<string, number>();
    for (const dia of DIAS) {
      const ym = dia.slice(0, 7);
      contagem.set(ym, (contagem.get(ym) ?? 0) + 1);
    }
    const erros: string[] = [];
    for (let y = 1900; y <= 2100; y++) {
      for (let m = 1; m <= 12; m++) {
        const ym = `${y}-${String(m).padStart(2, '0')}`;
        if (daysInMonth(y, m) !== contagem.get(ym)) erros.push(ym);
      }
    }
    expect(erros).toEqual([]);
    expect(contagem.size).toBe(2412);
  });

  it('monthPeriod de todos os meses de 1900 a 2100 começa no dia 1 e termina no último dia real', () => {
    const primeiroDoMes = new Map<string, string>();
    const ultimoDoMes = new Map<string, string>();
    for (const dia of DIAS) {
      const ym = dia.slice(0, 7);
      if (!primeiroDoMes.has(ym)) primeiroDoMes.set(ym, dia);
      ultimoDoMes.set(ym, dia);
    }
    const erros: string[] = [];
    for (const [ym, inicio] of primeiroDoMes) {
      const p = monthPeriod(ym);
      if (p.start !== inicio || p.end !== ultimoDoMes.get(ym)) erros.push(ym);
    }
    expect(erros).toEqual([]);
  });

  it('amostra com semente fixa: daysBetween(a, b) = índice(b) - índice(a), e é antissimétrico', () => {
    const rng = prng(20261118);
    const erros: string[] = [];
    for (let k = 0; k < 5000; k++) {
      const i = Math.floor(rng() * DIAS.length);
      const j = Math.floor(rng() * DIAS.length);
      const a = DIAS[i] as string;
      const b = DIAS[j] as string;
      const ab = daysBetween(a, b);
      if (ab !== j - i) erros.push(`${a} ${b}: ${ab}`);
      if (daysBetween(b, a) !== -ab) erros.push(`antissimetria ${a} ${b}`);
    }
    expect(erros.slice(0, 5)).toEqual([]);
  });

  it('um dia de diferença nunca dá zero nem dois, na virada de qualquer mês', () => {
    for (let i = 0; i + 1 < DIAS.length; i += 1) {
      const a = DIAS[i] as string;
      const b = DIAS[i + 1] as string;
      if (a.slice(0, 7) !== b.slice(0, 7)) {
        expect(daysBetween(a, b)).toBe(1);
      }
    }
  });
});

describe('QA T1.6 datas: anos 1900, 2000 e 2100 (e o ano seguinte)', () => {
  it('fevereiro: 1900 tem 28, 2000 tem 29, 2100 tem 28', () => {
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
  });

  it('atravessar fevereiro em 1900, 2000 e 2100', () => {
    expect(daysBetween('1900-02-28', '1900-03-01')).toBe(1);
    expect(daysBetween('2000-02-28', '2000-03-01')).toBe(2);
    expect(daysBetween('2100-02-28', '2100-03-01')).toBe(1);
  });

  it('monthPeriod de fevereiro nesses anos', () => {
    expect(monthPeriod('1900-02')).toEqual({ start: '1900-02-01', end: '1900-02-28' });
    expect(monthPeriod('2000-02')).toEqual({ start: '2000-02-01', end: '2000-02-29' });
    expect(monthPeriod('2100-02')).toEqual({ start: '2100-02-01', end: '2100-02-28' });
  });

  it('29 de fevereiro desses anos: 2000 aceita, 1900 e 2100 lançam', () => {
    expect(daysBetween('2000-02-29', '2000-03-01')).toBe(1);
    expect(() => daysBetween('1900-02-29', '1900-03-01')).toThrow(Error);
    expect(() => daysBetween('2100-02-29', '2100-03-01')).toThrow(Error);
    expect(() => monthPeriod('2100-02-29')).toThrow(Error);
  });

  it('1900-01-01 até 2100-12-31 são 73.413 dias de diferença (último índice)', () => {
    expect(daysBetween('1900-01-01', '2100-12-31')).toBe(73413);
  });

  it('2000 a 2100 são 36.525 dias (100 anos, 25 bissextos: 2000 a 2096)', () => {
    expect(daysBetween('2000-01-01', '2100-01-01')).toBe(36525);
  });

  it('regra do calendário fora da faixa: 2104 é bissexto, 2200 não, 2400 é', () => {
    expect(daysBetween('2104-02-28', '2104-03-01')).toBe(2);
    expect(() => daysBetween('2200-02-29', '2200-03-01')).toThrow(Error);
    expect(daysBetween('2400-02-28', '2400-03-01')).toBe(2);
  });

  it('primeiro e último dia do ano 1 (0001) funcionam', () => {
    expect(daysBetween('0001-01-01', '0001-12-31')).toBe(364);
  });
});

describe('QA T1.6 datas: entradas inválidas', () => {
  const FORMATOS_RUINS = [
    '',
    ' ',
    '2026-10-6',
    '2026-1-06',
    '26-10-06',
    '2026/10/06',
    '2026-10-06 ',
    ' 2026-10-06',
    '2026-10-06\n',
    '+2026-10-06',
    '2026-10-06T00:00',
    '２０２６-10-06',
    '2026-02-30',
    '2026-02-29',
    '2026-04-31',
    '2026-00-10',
    '2026-13-01',
    '2026-10-00',
    'lixo',
  ];

  it.each(FORMATOS_RUINS)('daysBetween com %j lança Error', (valor) => {
    expect(() => daysBetween(valor, '2026-10-06')).toThrow(Error);
    expect(() => daysBetween('2026-10-06', valor)).toThrow(Error);
  });

  it.each([null, undefined, 20261006, {}, []])(
    'daysBetween com tipo não string (%j) lança Error',
    (valor) => {
      expect(() => daysBetween(valor as string, '2026-10-06')).toThrow(Error);
    },
  );

  it.each(['2026-13', '2026-00', '26-10', '2026-1', '2026-10-01', '', '2026-10 ', '２０２６-10'])(
    'monthPeriod com %j lança Error',
    (valor) => {
      expect(() => monthPeriod(valor)).toThrow(Error);
    },
  );

  it.each([0, -1, 2026.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'daysInMonth com ano %s lança Error',
    (ano) => {
      expect(() => daysInMonth(ano, 1)).toThrow(Error);
    },
  );

  it.each([0, 13, -1, 1.5, '2' as unknown as number])(
    'daysInMonth com mês %j lança Error',
    (mes) => {
      expect(() => daysInMonth(2026, mes)).toThrow(Error);
    },
  );

  it('as mensagens de erro não repetem a entrada (nem dígitos dela)', () => {
    const mensagens: string[] = [];
    const tentativas: Array<() => unknown> = [
      () => daysBetween('2026-02-30', '2026-03-01'),
      () => daysBetween('7777-77-77', '2026-03-01'),
      () => monthPeriod('2026-13'),
      () => monthPeriod('9999-99'),
      () => daysInMonth(4242, 13),
    ];
    for (const t of tentativas) {
      try {
        t();
      } catch (e) {
        mensagens.push((e as Error).message);
      }
    }
    expect(mensagens).toHaveLength(tentativas.length);
    for (const msg of mensagens) {
      expect(msg).not.toMatch(/\d/);
    }
  });

  it('daysBetween é determinístico: a mesma entrada dá o mesmo número várias vezes', () => {
    const r = [1, 2, 3].map(() => daysBetween('2026-10-31', '2026-11-01'));
    expect(r).toEqual([1, 1, 1]);
  });
});
