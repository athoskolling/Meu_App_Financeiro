import { describe, expect, it } from 'vitest';
import type { Cents } from '../../../domain/money';
import {
  assignIdentities,
  baseKey,
  baseKeyInput,
  identityKey,
  normalizeText,
  type Mode,
  type NormalizedTransaction,
} from '../../../domain/transactions';

const nbsp = String.fromCharCode(0xa0);
const h = (s: string): string => `h(${s})`;
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

function make(over: Record<string, unknown>): NormalizedTransaction {
  return { ...base, ...over };
}

const bk = (t: NormalizedTransaction): string => baseKey(t, h);

describe('normalizeText', () => {
  it('colapsa espaços, tira acento e põe em minúsculas', () => {
    expect(normalizeText('  PADARIA   São  João ')).toBe('padaria sao joao');
  });
  it('remove marcas combinantes de acentos e cedilha', () => {
    expect(normalizeText('CAFÉ Ação')).toBe('cafe acao');
  });
  it('troca espaço sem quebra (U+00A0) por espaço comum', () => {
    expect(normalizeText(`a${nbsp} ${nbsp}b\tc`)).toBe('a b c');
  });
  it('a pontuação conta', () => {
    expect(normalizeText('Padaria.')).not.toBe(normalizeText('Padaria'));
  });
});

describe('baseKeyInput e baseKey', () => {
  it('o texto canônico é exatamente o definido no contrato', () => {
    expect(baseKeyInput(base)).toBe(
      '["manual","conta-1","2026-10-06",null,-830,"padaria exemplo"]',
    );
  });
  it('baseKey é o hash do texto canônico', () => {
    expect(bk(base)).toBe('h(["manual","conta-1","2026-10-06",null,-830,"padaria exemplo"])');
  });
  it('valor diferente muda a baseKey', () => {
    expect(bk(make({ amount: asCents(-831) }))).not.toBe(bk(base));
  });
  it('caixa, acento e espaços na descrição não mudam a baseKey', () => {
    expect(bk(make({ description: '  PADÁRIA   exemplo ' }))).toBe(bk(base));
  });
  it('hora informada muda a baseKey', () => {
    expect(bk(make({ time: '09:00' }))).not.toBe(bk(base));
  });
  it.each([
    ['source', 'open_finance'],
    ['accountRef', 'conta-2'],
    ['date', '2026-10-07'],
  ])('%s diferente muda a baseKey', (field, value) => {
    expect(bk(make({ [field]: value }))).not.toBe(bk(base));
  });
  it('externalId diferente não muda a baseKey', () => {
    expect(bk(make({ externalId: 'x1' }))).toBe(bk(make({ externalId: 'x2' })));
  });
  it('efetivação (pending para posted) não muda a baseKey', () => {
    expect(bk(make({ status: 'pending' }))).toBe(bk(make({ status: 'posted' })));
  });
  it.each([
    ['type', 'income'],
    ['postedAt', '2026-10-08'],
    ['merchantName', 'Outra Loja'],
  ])('%s diferente não muda a baseKey', (field, value) => {
    expect(bk(make({ [field]: value }))).toBe(bk(base));
  });
  it('itemId diferente (reconexão) não muda a baseKey', () => {
    expect(bk({ ...base, itemId: 'item-novo' } as NormalizedTransaction)).toBe(bk(base));
  });
  it('aspas e barra na descrição continuam JSON válido', () => {
    const t = make({ description: 'Loja "X" \\ Y' });
    expect(JSON.parse(baseKeyInput(t))).toEqual([
      'manual',
      'conta-1',
      '2026-10-06',
      null,
      -830,
      'loja "x" \\ y',
    ]);
  });
});

describe('identityKey', () => {
  it.each([NaN, Infinity, 0, -1, 1.5])('ocorrência inválida (%s) lança Error', (n) => {
    expect(() => identityKey('k', n, h)).toThrow(Error);
  });
  it('é o hash do JSON de [baseKey, ocorrência]', () => {
    expect(identityKey('k', 3, h)).toBe('h(["k",3])');
  });
});

const A = base;
const B = make({ description: 'Outra Coisa' });
const Aprime = make({ externalId: 'outro-id' });
const kA = bk(A);

function run(batch: NormalizedTransaction[], counts: Record<string, number>, mode: Mode) {
  return assignIdentities(batch, new Map(Object.entries(counts)), mode, h);
}
const summary = (r: ReturnType<typeof run>) => r.map((x) => [x.occurrence, x.isNew]);

describe('assignIdentities', () => {
  it('lote vazio devolve vazio nos dois modos', () => {
    expect(run([], {}, 'complete')).toEqual([]);
    expect(run([], {}, 'incremental')).toEqual([]);
  });
  it('é determinístico entre chamadas', () => {
    expect(run([A], {}, 'complete')[0]?.identityKey).toBe(run([A], {}, 'complete')[0]?.identityKey);
  });
  it('dois cafés iguais com banco vazio são duas transações distintas', () => {
    const r = run([A, A], {}, 'complete');
    expect(summary(r)).toEqual([
      [1, true],
      [2, true],
    ]);
    expect(r[0]?.identityKey).not.toBe(r[1]?.identityKey);
  });
  it('reimportação integral não cria linha nova', () => {
    expect(summary(run([A, A], { [kA]: 2 }, 'complete'))).toEqual([
      [1, false],
      [2, false],
    ]);
  });
  it('período sobreposto cria só a ocorrência excedente', () => {
    expect(summary(run([A, A, A], { [kA]: 2 }, 'complete'))).toEqual([
      [1, false],
      [2, false],
      [3, true],
    ]);
  });
  it('mistura de transações conta ocorrência por baseKey', () => {
    const r = run([A, B, A], { [kA]: 1 }, 'complete');
    expect(summary(r)).toEqual([
      [1, false],
      [1, true],
      [2, true],
    ]);
    expect(r[1]?.baseKey).toBe(bk(B));
  });
  it('id da fonte diferente reconhece a linha já gravada', () => {
    const r = run([Aprime], { [kA]: 1 }, 'complete');
    expect(summary(r)).toEqual([[1, false]]);
    expect(r[0]?.identityKey).toBe(identityKey(kA, 1, h));
  });
  it('reapresentação na fonte não duplica', () => {
    expect(summary(run([A], { [kA]: 1 }, 'complete'))).toEqual([[1, false]]);
  });
  it('lote incremental continua a contagem do banco', () => {
    expect(summary(run([A], { [kA]: 2 }, 'incremental'))).toEqual([[3, true]]);
  });
  it('incremental misto', () => {
    expect(summary(run([A, B, A], { [kA]: 2 }, 'incremental'))).toEqual([
      [3, true],
      [1, true],
      [4, true],
    ]);
  });
  it('incremental com banco vazio começa em 1', () => {
    expect(summary(run([A, A], {}, 'incremental'))).toEqual([
      [1, true],
      [2, true],
    ]);
  });
  it('chave ausente no mapa vale zero', () => {
    expect(summary(run([B], { [kA]: 5 }, 'complete'))).toEqual([[1, true]]);
  });
  it('mesma ocorrência dá a mesma identityKey nos dois modos', () => {
    const c = run([A, A, A], {}, 'complete')[2];
    const i = run([A], { [kA]: 2 }, 'incremental')[0];
    expect(c?.occurrence).toBe(3);
    expect(i?.identityKey).toBe(c?.identityKey);
  });
  it('mantém ordem e referência das transações', () => {
    const batch = [B, A, Aprime, B];
    const r = run(batch, {}, 'complete');
    expect(r).toHaveLength(batch.length);
    r.forEach((x, i) => expect(x.tx).toBe(batch[i]));
  });
  it('não muta lote, transações nem mapa', () => {
    const batch = Object.freeze([Object.freeze({ ...A }), Object.freeze({ ...B })]);
    const boom = (): never => {
      throw new Error('mutação');
    };
    const guarded = Object.assign(new Map([[kA, 1]]), { set: boom, delete: boom, clear: boom });
    expect(() => assignIdentities(batch, guarded, 'complete', h)).not.toThrow();
    expect(() => assignIdentities(batch, guarded, 'incremental', h)).not.toThrow();
  });
  it.each([-1, 1.5, NaN])('existingCounts inválido (%s) lança Error', (v) => {
    expect(() => run([A], { [kA]: v }, 'complete')).toThrow(Error);
  });
  it('existingCounts fora do inteiro seguro lança Error em complete', () => {
    expect(() => run([A], { [kA]: 2 ** 60 }, 'complete')).toThrow(Error);
  });
  it('mode inválido lança Error', () => {
    expect(() => run([A], {}, 'x' as Mode)).toThrow(Error);
  });
});
