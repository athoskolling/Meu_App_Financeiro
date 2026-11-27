import { describe, expect, it } from 'vitest';
import type { Cents } from '../../../src/domain/money';
import {
  assignIdentities,
  baseKey,
  baseKeyInput,
  identityKey,
  normalizeText,
  type Mode,
  type NormalizedTransaction,
} from '../../../src/domain/transactions';

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
  it('remove marcas combinantes de acentos, cedilha e espaço sem quebra (U+00A0)', () => {
    expect(normalizeText(`CAFÉ${nbsp}Ação`)).toBe('cafe acao');
  });
  it('troca espaço sem quebra (U+00A0) e tab por espaço comum', () => {
    expect(normalizeText(`a${nbsp} ${nbsp}b\tc`)).toBe('a b c');
  });
  it('pontuação diferencia descrições na normalização', () => {
    expect(normalizeText('Padaria.')).not.toBe(normalizeText('Padaria'));
  });
  it('C2.1: espaço Unicode NEL (U+0085) vira espaço comum', () => {
    expect(normalizeText('a' + String.fromCharCode(0x85) + 'b')).toBe('a b');
  });
  it('C2.2: tab, quebras de linha e espaços Unicode (U+202F, U+3000) viram espaço comum', () => {
    const cases = ['a\tb', 'a\nb', 'a\r\nb', 'a\u202fb', 'a\u3000b'];
    for (const input of cases) {
      expect(normalizeText(input)).toBe('a b');
    }
  });
  it('C2.3: espaço de largura zero (U+200B) não é White_Space e permanece intacto', () => {
    expect(normalizeText('a\u200bb')).toBe('a\u200bb');
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
  it('C2.4: descrição em NFC e em NFD produzem a mesma baseKey', () => {
    const nfc = make({ description: 'Caf\u00e9' });
    const nfd = make({ description: 'Cafe\u0301' });
    expect(bk(nfc)).toBe(bk(nfd));
  });
  it('C2.5: valor 0 e -0 produzem a mesma baseKey', () => {
    const zero = make({ amount: asCents(0) });
    const negZero = make({ amount: asCents(-0) });
    expect(baseKeyInput(negZero)).toBe(baseKeyInput(zero));
    expect(bk(negZero)).toBe(bk(zero));
  });
});

describe('identityKey', () => {
  it('C2.10: identityKey rejeita ocorrência inválida ou fora de inteiro seguro', () => {
    for (const n of [0, -1, 1.5, NaN, Infinity, 2 ** 53]) {
      expect(() => identityKey('k', n, h)).toThrow(Error);
    }
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
  it('lote incremental misto continua a contagem por baseKey', () => {
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
    expect(() => run([A], { [kA]: v }, 'incremental')).toThrow(Error);
  });
  it('mode inválido lança Error', () => {
    expect(() => run([A], {}, 'x' as Mode)).toThrow(Error);
  });
  it('C2.6: mesma compra em contas diferentes conta ocorrências separadas', () => {
    const aConta2 = make({ accountRef: 'conta-2' });
    const r = run([A, aConta2], {}, 'complete');
    expect(summary(r)).toEqual([
      [1, true],
      [1, true],
    ]);
    expect(r[0]?.baseKey).not.toBe(r[1]?.baseKey);
  });
  it('C2.7: existingCounts com Infinity, fora de inteiro seguro, texto ou null lança Error nos dois modos', () => {
    const invalidValues = [Infinity, 2 ** 60, '2' as unknown as number, null as unknown as number];
    for (const v of invalidValues) {
      expect(() => run([A], { [kA]: v }, 'complete')).toThrow(Error);
      expect(() => run([A], { [kA]: v }, 'incremental')).toThrow(Error);
    }
  });
  it('C2.8: existingCounts com contagem zero é aceito e marca primeira ocorrência como nova', () => {
    expect(summary(run([A], { [kA]: 0 }, 'complete'))).toEqual([[1, true]]);
  });
  it('C2.9: existingCounts inválido em chave ausente do lote ainda lança Error', () => {
    const kB = bk(B);
    expect(() => run([A], { [kB]: -1 }, 'complete')).toThrow(Error);
    expect(() => run([A], { [kB]: -1 }, 'incremental')).toThrow(Error);
  });
  it('C2.11: lote incremental que ultrapassa Number.MAX_SAFE_INTEGER lança Error', () => {
    expect(() => run([A, A], { [kA]: Number.MAX_SAFE_INTEGER - 1 }, 'incremental')).toThrow(Error);
  });
  it('C2.12: mode undefined, vazio ou em maiúsculas lança Error', () => {
    for (const invalidMode of [undefined, '', 'COMPLETE']) {
      expect(() => run([A], {}, invalidMode as unknown as Mode)).toThrow(Error);
    }
  });
  it('C2.13: mensagens de erro são fixas e nunca vazam descrição, baseKey nem valores', () => {
    const kB = bk(B);
    const errorCalls: Array<() => unknown> = [
      () => run([A], { [kA]: Infinity }, 'complete'),
      () => run([A], { [kA]: 2 ** 60 }, 'complete'),
      () => run([A], { [kA]: '2' as unknown as number }, 'complete'),
      () => run([A], { [kA]: null as unknown as number }, 'incremental'),
      () => run([A], { [kB]: -1 }, 'complete'),
      () => identityKey(kA, 0, h),
      () => identityKey(kA, 2 ** 53, h),
      () => run([A, A], { [kA]: Number.MAX_SAFE_INTEGER - 1 }, 'incremental'),
      () => run([A], {}, undefined as unknown as Mode),
      () => run([A], {}, '' as Mode),
      () => run([A], {}, 'COMPLETE' as Mode),
    ];

    for (const call of errorCalls) {
      let caught: unknown;
      try {
        call();
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(Error);
      const message = (caught as Error).message;
      expect(message.toLowerCase()).not.toContain('padaria');
      expect(message).not.toContain(kA);
      expect(message).not.toContain(kB);
      expect(message).not.toContain('1152921504606846976');
    }
  });
  it('C2.14: reimportação de 13 linhas iguais contra 12 existentes marca apenas a 13ª como nova', () => {
    const batch = Array.from({ length: 13 }, () => A);
    const r = run(batch, { [kA]: 12 }, 'complete');
    expect(r).toHaveLength(13);
    for (let i = 0; i < 12; i++) {
      expect(r[i]?.occurrence).toBe(i + 1);
      expect(r[i]?.isNew).toBe(false);
    }
    expect(r[12]?.occurrence).toBe(13);
    expect(r[12]?.isNew).toBe(true);
  });
});
