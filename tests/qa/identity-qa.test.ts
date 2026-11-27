// QA independente da T1.3 (Identidade e dedup com existingCounts) e parte de identidade da T1.4.
// Dados sempre sintéticos. Sem Date, sem Math.random: fuzz/embaralhamento usam PRNG determinístico.
// Caracteres Unicode invisíveis escritos exclusivamente via escape (\uXXXX / String.fromCharCode).
import { describe, expect, it } from 'vitest';
import type { Cents } from '../../src/domain/money';
import {
  assignIdentities,
  baseKey,
  baseKeyInput,
  identityKey,
  normalizeText,
  type Hash,
  type Mode,
  type NormalizedTransaction,
  type TransactionSource,
  type TransactionStatus,
  type TransactionType,
} from '../../src/domain/transactions';

const asCents = (n: number): Cents => n as Cents;
const h: Hash = (s) => `h(${s})`;

const BASE: NormalizedTransaction = {
  source: 'manual',
  accountRef: 'conta-1',
  date: '2026-10-06',
  description: 'Padaria Exemplo',
  amount: asCents(-830),
  currency: 'BRL',
  type: 'expense',
  status: 'posted',
};

function makeTx(
  over: Partial<NormalizedTransaction> | Record<string, unknown> = {},
): NormalizedTransaction {
  return { ...BASE, ...over };
}

/** PRNG determinístico (xorshift32) para embaralhamentos e fuzz sem Math.random. */
function makeRng(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x1_0000_0000;
  };
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Hash determinístico estilo FNV-1a duplo (64 bits hex) para verificar colisões em lote. */
const deterministicHash64: Hash = (input: string) => {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
};

describe('QA T1.3/T1.4: propriedades de reimportação integral (complete)', () => {
  it('reimportar N repetições (0 a 25) com existingCount igual a N nunca cria linha nova e gera ocorrências 1..N', () => {
    for (let n = 0; n <= 25; n++) {
      const tx = makeTx({ description: `Lote Repetido ${n}` });
      const bk = baseKey(tx, h);
      const batch = Array.from({ length: n }, (_, idx) =>
        makeTx({
          description: `Lote Repetido ${n}`,
          externalId: `ext-${idx}`,
          status: idx % 2 === 0 ? 'pending' : 'posted',
        }),
      );
      const counts = new Map<string, number>(n > 0 ? [[bk, n]] : []);
      const result = assignIdentities(batch, counts, 'complete', h);

      expect(result).toHaveLength(n);
      result.forEach((item, idx) => {
        expect(item.baseKey).toBe(bk);
        expect(item.occurrence).toBe(idx + 1);
        expect(item.isNew).toBe(false);
        expect(item.identityKey).toBe(identityKey(bk, idx + 1, h));
        expect(item.tx).toBe(batch[idx]);
      });
    }
  });

  it('reimportação integral com múltiplas contas e fontes isola a contagem por (source, accountRef)', () => {
    const sources: TransactionSource[] = ['manual', 'open_finance', 'caju_ocr'];
    const accounts = ['conta-a', 'conta-b', 'cartao-x'];
    const counts = new Map<string, number>();
    const batch: NormalizedTransaction[] = [];
    const expectedTotalByBk = new Map<string, number>();

    let repeat = 1;
    for (const source of sources) {
      for (const accountRef of accounts) {
        const template = makeTx({
          source,
          accountRef,
          description: 'Mercado Central',
          amount: asCents(-1500),
        });
        const bk = baseKey(template, h);
        const qty = repeat;
        counts.set(bk, qty);
        expectedTotalByBk.set(bk, qty);
        for (let i = 0; i < qty; i++) {
          batch.push(
            makeTx({ source, accountRef, description: 'Mercado Central', amount: asCents(-1500) }),
          );
        }
        repeat++;
      }
    }

    const rng = makeRng(20261126);
    const shuffled = shuffle(batch, rng);
    const result = assignIdentities(shuffled, counts, 'complete', h);

    expect(result).toHaveLength(shuffled.length);
    for (const item of result) {
      expect(item.isNew).toBe(false);
    }

    // Cada baseKey aparece exatamente 1..qty sem buracos
    const occsByBk = new Map<string, number[]>();
    for (const item of result) {
      const list = occsByBk.get(item.baseKey) ?? [];
      list.push(item.occurrence);
      occsByBk.set(item.baseKey, list);
    }
    for (const [bk, total] of expectedTotalByBk) {
      expect(occsByBk.get(bk)).toEqual(Array.from({ length: total }, (_, i) => i + 1));
    }
  });
});

describe('QA T1.3/T1.4: propriedade de contagem de novas em período sobreposto (complete)', () => {
  it('total de isNew === true por baseKey é sempre Math.max(0, countNoLote - existingCount), mesmo intercalado fora de ordem', () => {
    const rng = makeRng(42);
    const templates = [
      makeTx({ description: 'Cafe', amount: asCents(-500), date: '2026-10-01' }),
      makeTx({ description: 'Padaria', amount: asCents(-1200), date: '2026-10-02' }),
      makeTx({
        description: 'Farmacia',
        amount: asCents(-4590),
        date: '2026-10-03',
        source: 'open_finance',
      }),
      makeTx({
        description: 'Almoco',
        amount: asCents(-3200),
        date: '2026-10-04',
        source: 'caju_ocr',
      }),
      makeTx({
        description: 'Salario',
        amount: asCents(500000),
        date: '2026-10-05',
        type: 'income',
      }),
    ];

    for (let trial = 0; trial < 20; trial++) {
      const counts = new Map<string, number>();
      const countInBatch = new Map<string, number>();
      const batch: NormalizedTransaction[] = [];

      for (const tpl of templates) {
        const bk = baseKey(tpl, h);
        const existing = Math.floor(rng() * 8); // 0..7
        const inBatch = Math.floor(rng() * 10); // 0..9
        if (existing > 0 || trial % 2 === 0) {
          counts.set(bk, existing);
        }
        countInBatch.set(bk, inBatch);
        for (let i = 0; i < inBatch; i++) {
          batch.push(
            makeTx({
              ...tpl,
              externalId: `t-${trial}-${i}`,
              merchantName: i % 2 === 0 ? 'Nome A' : 'Nome B',
              status: i % 3 === 0 ? 'pending' : 'posted',
            }),
          );
        }
      }

      const mixedBatch = shuffle(batch, rng);
      const result = assignIdentities(mixedBatch, counts, 'complete', h);

      const newByBk = new Map<string, number>();
      const maxOccByBk = new Map<string, number>();
      for (const item of result) {
        if (item.isNew) {
          newByBk.set(item.baseKey, (newByBk.get(item.baseKey) ?? 0) + 1);
        }
        maxOccByBk.set(item.baseKey, Math.max(maxOccByBk.get(item.baseKey) ?? 0, item.occurrence));
      }

      for (const tpl of templates) {
        const bk = baseKey(tpl, h);
        const existing = counts.get(bk) ?? 0;
        const inBatch = countInBatch.get(bk) ?? 0;
        expect(newByBk.get(bk) ?? 0).toBe(Math.max(0, inBatch - existing));
        expect(maxOccByBk.get(bk) ?? 0).toBe(inBatch);
      }
    }
  });
});

describe('QA T1.3/T1.4: propriedades do modo incremental', () => {
  it('todas as transações recebem isNew === true, ocorrências consecutivas (existing+1..existing+k) e mesma identityKey do modo complete', () => {
    const rng = makeRng(999);
    const templates = [
      makeTx({ description: 'Mercado A', amount: asCents(-1000) }),
      makeTx({ description: 'Mercado B', amount: asCents(-2000), accountRef: 'conta-2' }),
      makeTx({ description: 'Mercado C', amount: asCents(-3000), time: '14:30' }),
    ];

    for (let trial = 0; trial < 15; trial++) {
      const existingCounts = new Map<string, number>();
      const batch: NormalizedTransaction[] = [];
      const kByBk = new Map<string, number>();

      for (const tpl of templates) {
        const bk = baseKey(tpl, h);
        const existing = Math.floor(rng() * 12);
        const k = Math.floor(rng() * 6);
        existingCounts.set(bk, existing);
        kByBk.set(bk, k);
        for (let i = 0; i < k; i++) {
          batch.push(makeTx({ ...tpl, externalId: `inc-${trial}-${i}` }));
        }
      }

      const mixed = shuffle(batch, rng);
      const incResult = assignIdentities(mixed, existingCounts, 'incremental', h);

      // Todas isNew === true e ocorrências consecutivas por baseKey sem buracos
      const seenOccs = new Map<string, number[]>();
      for (const item of incResult) {
        expect(item.isNew).toBe(true);
        const list = seenOccs.get(item.baseKey) ?? [];
        list.push(item.occurrence);
        seenOccs.set(item.baseKey, list);
      }

      for (const tpl of templates) {
        const bk = baseKey(tpl, h);
        const existing = existingCounts.get(bk) ?? 0;
        const k = kByBk.get(bk) ?? 0;
        const expectedOccs = Array.from({ length: k }, (_, i) => existing + i + 1);
        expect(seenOccs.get(bk) ?? []).toEqual(expectedOccs);

        // Comparação com modo complete para as mesmas ocorrências
        if (k > 0) {
          const fullBatch = Array.from({ length: existing + k }, () => makeTx(tpl));
          const completeResult = assignIdentities(fullBatch, new Map(), 'complete', h);
          const incItemsForBk = incResult.filter((x) => x.baseKey === bk);
          for (let i = 0; i < k; i++) {
            const completeItem = completeResult[existing + i]!;
            const incItem = incItemsForBk[i]!;
            expect(incItem.occurrence).toBe(completeItem.occurrence);
            expect(incItem.identityKey).toBe(completeItem.identityKey);
          }
        }
      }
    }
  });
});

describe('QA T1.3/T1.4: unicidade de identityKey no lote', () => {
  it('quando hash é injetivo, todas as identityKeys de um lote grande e heterogêneo são únicas', () => {
    const batch: NormalizedTransaction[] = [];
    const rng = makeRng(777);

    // Gera repetições intencionais + variações de campos relevantes e irrelevantes
    for (let i = 0; i < 120; i++) {
      const bucket = i % 10;
      batch.push(
        makeTx({
          date: `2026-10-${String((bucket % 5) + 1).padStart(2, '0')}`,
          description: bucket % 2 === 0 ? 'Café da Esquina' : 'Mercado do Bairro',
          amount: asCents(-100 - (bucket % 3)),
          externalId: `ext-${i}`,
          status: i % 2 === 0 ? 'pending' : 'posted',
        }),
      );
    }
    const shuffled = shuffle(batch, rng);

    for (const mode of ['complete', 'incremental'] as const) {
      const existingCounts = new Map<string, number>();
      for (const tx of shuffled.slice(0, 5)) {
        existingCounts.set(baseKey(tx, h), 3);
      }

      // Hash injetivo (identidade canônica h)
      const resInjetivo = assignIdentities(shuffled, existingCounts, mode, h);
      const keysInjetivo = new Set(resInjetivo.map((x) => x.identityKey));
      expect(keysInjetivo.size).toBe(shuffled.length);

      // Hash sintético FNV-1a duplo (simula digest sem colisão)
      const existingHex = new Map<string, number>();
      for (const tx of shuffled.slice(0, 5)) {
        existingHex.set(baseKey(tx, deterministicHash64), 3);
      }
      const resHex = assignIdentities(shuffled, existingHex, mode, deterministicHash64);
      const keysHex = new Set(resHex.map((x) => x.identityKey));
      expect(keysHex.size).toBe(shuffled.length);
    }
  });
});

describe('QA T1.3: imutabilidade total de entradas', () => {
  it('não muta batch, transações congeladas nem ReadonlyMap nos modos complete e incremental', () => {
    const frozenTxs = [
      Object.freeze({ ...BASE, description: 'Item 1' }),
      Object.freeze({ ...BASE, description: 'Item 1', time: '08:00' }),
      Object.freeze({
        ...BASE,
        description: 'Item 2',
        amount: asCents(1000),
        type: 'income',
      }),
    ];
    const frozenBatch = Object.freeze(frozenTxs);
    const bk1 = baseKey(frozenTxs[0]!, h);
    const innerMap = new Map<string, number>([[bk1, 2]]);

    const throwOnMutate = (): never => {
      throw new Error('tentativa de mutação do mapa');
    };
    const strictReadonlyMap: ReadonlyMap<string, number> = {
      get: (k) => innerMap.get(k),
      has: (k) => innerMap.has(k),
      entries: () => innerMap.entries(),
      keys: () => innerMap.keys(),
      values: () => innerMap.values(),
      forEach: (cb, thisArg) => innerMap.forEach(cb, thisArg),
      get size() {
        return innerMap.size;
      },
      [Symbol.iterator]: () => innerMap[Symbol.iterator](),
      // Simula mapa estrito onde métodos de escrita não existem ou lançam erro
      ...({ set: throwOnMutate, delete: throwOnMutate, clear: throwOnMutate } as object),
    };

    for (const mode of ['complete', 'incremental'] as const) {
      const out = assignIdentities(frozenBatch, strictReadonlyMap, mode, h);
      expect(out).toHaveLength(3);
      out.forEach((item, idx) => {
        expect(item.tx).toBe(frozenBatch[idx]);
      });
    }
  });
});

describe('QA T1.3: bordas de existingCounts e atomicidade de overflow', () => {
  it('aceita chaves no mapa com nomes de Object.prototype (constructor, toString, __proto__, valueOf)', () => {
    const protoNames = ['constructor', 'toString', '__proto__', 'valueOf', 'hasOwnProperty'];
    const counts = new Map<string, number>(protoNames.map((name, idx) => [name, idx]));
    const batch = [makeTx()];

    expect(() => assignIdentities(batch, counts, 'complete', h)).not.toThrow();
    expect(() => assignIdentities(batch, counts, 'incremental', h)).not.toThrow();

    // Mesmo quando o hash devolve literalmente um desses nomes como baseKey
    const hostileHash: Hash = () => '__proto__';
    const rComplete = assignIdentities(batch, counts, 'complete', hostileHash);
    expect(rComplete[0]?.occurrence).toBe(1);
    expect(rComplete[0]?.isNew).toBe(false); // counts.get('__proto__') === 2

    const rInc = assignIdentities(batch, counts, 'incremental', hostileHash);
    expect(rInc[0]?.occurrence).toBe(3); // 2 + 1
    expect(rInc[0]?.isNew).toBe(true);
  });

  it('rejeita valores inválidos em existingCounts mesmo quando a chave não está no lote e o lote é vazio', () => {
    const invalidValues: unknown[] = [
      -1,
      -0.1,
      0.5,
      1.5,
      NaN,
      Infinity,
      -Infinity,
      2 ** 53,
      2 ** 60,
      '1',
      null,
      undefined,
      true,
      {},
      0n,
    ];
    for (const v of invalidValues) {
      const counts = new Map<string, number>([['chave-ausente-do-lote', v as number]]);
      expect(() => assignIdentities([], counts, 'complete', h)).toThrow(Error);
      expect(() => assignIdentities([makeTx()], counts, 'complete', h)).toThrow(Error);
      expect(() => assignIdentities([], counts, 'incremental', h)).toThrow(Error);
      expect(() => assignIdentities([makeTx()], counts, 'incremental', h)).toThrow(Error);
    }
  });

  it('garante atomicidade quando overflow em Number.MAX_SAFE_INTEGER ocorre na 3ª linha igual de um lote (lança Error sem retorno parcial)', () => {
    const tx = makeTx();
    const bk = baseKey(tx, h);
    const counts = new Map<string, number>([[bk, Number.MAX_SAFE_INTEGER - 2]]);

    // 2 linhas iguais: ocorrências MAX_SAFE_INTEGER - 1 e MAX_SAFE_INTEGER -> deve aceitar
    expect(() => assignIdentities([tx, tx], counts, 'incremental', h)).not.toThrow();

    // 3 linhas iguais: 3ª linha estoura MAX_SAFE_INTEGER -> deve lançar Error atomicamente
    let returned: unknown = 'not-returned';
    let caught: unknown;
    try {
      returned = assignIdentities([tx, tx, tx], counts, 'incremental', h);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(returned).toBe('not-returned');
  });

  it('rejeita -0? Não: -0 em existingCounts é safe integer >= 0 (comporta-se como 0)', () => {
    const tx = makeTx();
    const bk = baseKey(tx, h);
    const counts = new Map<string, number>([[bk, -0]]);
    const r = assignIdentities([tx], counts, 'complete', h);
    expect(r[0]?.occurrence).toBe(1);
    expect(r[0]?.isNew).toBe(true);
  });
});

describe('QA T1.3: bordas de normalizeText e baseKeyInput', () => {
  it('combina NFC e NFD com múltiplos diacríticos produzindo o mesmo texto normalizado', () => {
    const nfc = 'A\u00e7\u00e3o \u00c9pica Cor\u00e7\u00e3o \u00dcber \u00d1o\u00f1o';
    const nfd = 'Ac\u0327a\u0303o E\u0301pica Corc\u0327a\u0303o U\u0308ber N\u0303on\u0303o';
    expect(normalizeText(nfc)).toBe(normalizeText(nfd));
    expect(normalizeText(nfc)).toBe('acao epica corcao uber nono');
  });

  it('converte todos os espaços Unicode relevantes (NEL, NBSP, NNBSP, ideográfico, tab, CRLF) para espaço comum único e faz trim', () => {
    const nel = String.fromCharCode(0x85);
    const input = `\u3000\u00a0${nel}  Palavra1\u202f\t\r\n\u00a0${nel}\u3000Palavra2  \u202f\n`;
    expect(normalizeText(input)).toBe('palavra1 palavra2');
  });

  it('preserva pontuação e caracteres não-White_Space (U+200B em qualquer posição e U+FEFF interno; BOM nas pontas é removido pelo .trim() do JS)', () => {
    expect(normalizeText('Padaria, Ltda. - Filial #2!')).toBe('padaria, ltda. - filial #2!');
    expect(normalizeText('a\u200bb\ufeffc')).toBe('a\u200bb\ufeffc');
    expect(normalizeText('Padaria\u200b')).not.toBe(normalizeText('Padaria'));
    expect(normalizeText('\u200bPadaria')).not.toBe(normalizeText('Padaria'));
    // Nota de borda: na especificação ECMAScript, String.prototype.trim() remove U+FEFF (BOM) nas pontas,
    // embora U+FEFF não tenha a propriedade Unicode White_Space (mantido quando interno).
    expect(normalizeText('\ufeffPadaria\ufeff')).toBe('padaria');
  });

  it('duas execuções intercaladas/concorrentes não compartilham estado mutável interno', () => {
    const batch1 = [makeTx({ description: 'Compra 1' }), makeTx({ description: 'Compra 1' })];
    const batch2 = [makeTx({ description: 'Compra 1' })];
    const counts1 = new Map<string, number>([[baseKey(batch1[0]!, h), 1]]);
    const counts2 = new Map<string, number>();

    const r1a = assignIdentities(batch1, counts1, 'complete', h);
    const r2 = assignIdentities(batch2, counts2, 'complete', h);
    const r1b = assignIdentities(batch1, counts1, 'complete', h);

    expect(r1a).toEqual(r1b);
    expect(r1a.map((x) => [x.occurrence, x.isNew])).toEqual([
      [1, false],
      [2, true],
    ]);
    expect(r2.map((x) => [x.occurrence, x.isNew])).toEqual([[1, true]]);
  });

  it('retorna string vazia para entrada vazia ou composta apenas por espaços Unicode', () => {
    const nel = String.fromCharCode(0x85);
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   \t\r\n  ')).toBe('');
    expect(normalizeText(`\u00a0${nel}\u202f\u3000`)).toBe('');
  });

  it('normaliza -0 em amount como 0 e trata time ausente vs undefined como null no JSON canônico', () => {
    const withoutTime = makeTx({ amount: asCents(-0) });
    const undefinedTime = makeTx({ amount: asCents(0), time: undefined });
    expect(baseKeyInput(withoutTime)).toBe(baseKeyInput(undefinedTime));
    expect(baseKeyInput(withoutTime)).toBe(
      '["manual","conta-1","2026-10-06",null,0,"padaria exemplo"]',
    );
  });

  it('todos os campos que ficam fora da baseKey não alteram baseKeyInput', () => {
    const statuses: TransactionStatus[] = ['pending', 'posted'];
    const types: TransactionType[] = [
      'income',
      'expense',
      'transfer',
      'credit_card_purchase',
      'credit_card_payment',
      'refund',
      'investment',
      'other',
    ];
    const baseCanonical = baseKeyInput(BASE);
    for (const status of statuses) {
      for (const type of types) {
        const varied = makeTx({
          status,
          type,
          postedAt: '2026-12-31',
          externalId: `ext-${type}-${status}`,
          merchantName: `Merchant ${type}`,
        });
        expect(baseKeyInput(varied)).toBe(baseCanonical);
      }
    }
  });
});

describe('QA T1.3: segurança e não vazamento de dados em mensagens de erro', () => {
  it('nenhum Error lançado por identityKey ou assignIdentities vaza descrição, baseKey, accountRef, amount ou valor inválido', () => {
    const secretTx = makeTx({
      accountRef: 'conta-secreta-9988',
      description: 'Compra Confidencial XYZ',
      amount: asCents(-98765),
    });
    const secretBk = baseKey(secretTx, h);
    const invalidCount = 2 ** 60;
    const negativeInvalid = -424242;

    const calls: Array<() => unknown> = [
      () => identityKey(secretBk, 0, h),
      () => identityKey(secretBk, -5, h),
      () => identityKey(secretBk, 1.25, h),
      () => identityKey(secretBk, NaN, h),
      () => identityKey(secretBk, Infinity, h),
      () => identityKey(secretBk, 2 ** 53, h),
      () => assignIdentities([secretTx], new Map([[secretBk, invalidCount]]), 'complete', h),
      () => assignIdentities([secretTx], new Map([[secretBk, negativeInvalid]]), 'incremental', h),
      () =>
        assignIdentities(
          [secretTx],
          new Map([[secretBk, '99999' as unknown as number]]),
          'complete',
          h,
        ),
      () =>
        assignIdentities(
          [secretTx],
          new Map([[secretBk, null as unknown as number]]),
          'incremental',
          h,
        ),
      () => assignIdentities([secretTx], new Map(), 'INVALID_MODE' as Mode, h),
      () => assignIdentities([secretTx], new Map(), undefined as unknown as Mode, h),
      () =>
        assignIdentities(
          [secretTx, secretTx],
          new Map([[secretBk, Number.MAX_SAFE_INTEGER - 1]]),
          'incremental',
          h,
        ),
    ];

    for (const fn of calls) {
      let caught: unknown;
      try {
        fn();
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(Error);
      const msg = (caught as Error).message.toLowerCase();
      expect(msg).not.toContain('confidencial');
      expect(msg).not.toContain('xyz');
      expect(msg).not.toContain('conta-secreta-9988');
      expect(msg).not.toContain('98765');
      expect(msg).not.toContain(secretBk.toLowerCase());
      expect(msg).not.toContain(String(invalidCount));
      expect(msg).not.toContain(String(negativeInvalid));
      expect(msg).not.toContain('99999');
    }
  });
});
