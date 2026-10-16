import { describe, expect, it } from 'vitest';
import { createLogger } from '../../lib/log';

function novo() {
  const linhas: string[] = [];
  const log = createLogger({
    now: () => '2026-10-15T12:00:00.000Z',
    write: (l) => linhas.push(l),
  });
  return { log, linhas };
}

describe('createLogger', () => {
  it('escreve a linha JSON exata', () => {
    const { log, linhas } = novo();
    log.info('sync.start', { syncId: 's1', count: 3 });
    expect(linhas).toEqual([
      '{"ts":"2026-10-15T12:00:00.000Z","level":"info","event":"sync.start","syncId":"s1","count":3}',
    ]);
  });

  it('warn usa level warn', () => {
    const { log, linhas } = novo();
    log.warn('x');
    expect(JSON.parse(linhas[0]!)).toMatchObject({ level: 'warn', event: 'x' });
  });

  it('descarta chaves fora da lista e conta sem citar nomes', () => {
    const { log, linhas } = novo();
    log.info('x', { amount: -1230, description: 'Padaria', count: 1 } as never);
    const linha = linhas[0]!;
    expect(linha).not.toContain('amount');
    expect(linha).not.toContain('description');
    expect(linha).not.toContain('Padaria');
    expect(linha).not.toContain('1230');
    expect(JSON.parse(linha)).toMatchObject({ count: 1, droppedKeys: 2 });
  });

  it('descarta string com mais de 64 caracteres', () => {
    const { log, linhas } = novo();
    log.info('x', { code: 'a'.repeat(65) });
    const obj = JSON.parse(linhas[0]!) as Record<string, unknown>;
    expect(obj).not.toHaveProperty('code');
    expect(obj.droppedKeys).toBe(1);
  });

  it('aceita string de 64 caracteres, boolean e null', () => {
    const { log, linhas } = novo();
    log.info('x', { code: 'a'.repeat(64), status: null, stage: true });
    const obj = JSON.parse(linhas[0]!) as Record<string, unknown>;
    expect(obj.code).toBe('a'.repeat(64));
    expect(obj.status).toBeNull();
    expect(obj.stage).toBe(true);
    expect(obj).not.toHaveProperty('droppedKeys');
  });

  it('descarta valor de tipo não permitido (objeto)', () => {
    const { log, linhas } = novo();
    log.info('x', { count: { a: 1 } } as never);
    const obj = JSON.parse(linhas[0]!) as Record<string, unknown>;
    expect(obj).not.toHaveProperty('count');
    expect(obj.droppedKeys).toBe(1);
  });

  it('error registra só name e code do erro', () => {
    const { log, linhas } = novo();
    log.error('falhou', Object.assign(new Error('token=abc R$ 12,30'), { code: 'PLUGGY_401' }));
    const linha = linhas[0]!;
    expect(JSON.parse(linha)).toMatchObject({
      level: 'error',
      errorName: 'Error',
      errorCode: 'PLUGGY_401',
    });
    expect(linha).not.toContain('token');
    expect(linha).not.toContain('abc');
    expect(linha).not.toContain('12,30');
    expect(linha).not.toContain('stack');
  });

  it('error com valor que não é Error registra unknown e não lança', () => {
    const { log, linhas } = novo();
    expect(() => log.error('falhou', 'texto qualquer')).not.toThrow();
    const linha = linhas[0]!;
    expect(JSON.parse(linha)).toMatchObject({ errorName: 'unknown' });
    expect(linha).not.toContain('texto qualquer');
  });

  it('error aceita fields e registra o evento', () => {
    const { log, linhas } = novo();
    log.error('falhou', undefined, { count: 2 });
    expect(JSON.parse(linhas[0]!)).toMatchObject({ level: 'error', count: 2 });
  });

  it('code do erro que não é string é ignorado', () => {
    const { log, linhas } = novo();
    log.error('f', Object.assign(new Error('m'), { code: 500 }));
    expect(JSON.parse(linhas[0]!) as object).not.toHaveProperty('errorCode');
  });

  it('cada chamada escreve exatamente uma linha JSON válida', () => {
    const { log, linhas } = novo();
    log.info('a');
    log.warn('b', { count: 1 });
    log.error('c', new Error('x'));
    expect(linhas).toHaveLength(3);
    for (const l of linhas) {
      expect(l).not.toContain('\n');
      expect(() => {
        JSON.parse(l);
      }).not.toThrow();
    }
  });
});
