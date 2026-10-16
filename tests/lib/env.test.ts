import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../lib/env';

const OK = { DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/db', OWNER_EMAIL: 'dono@example.com' };

function mensagem(source: Record<string, string | undefined>): string {
  try {
    loadEnv(source);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('esperava que loadEnv lançasse');
}

describe('loadEnv', () => {
  it('aceita as obrigatórias e normaliza OWNER_EMAIL', () => {
    const env = loadEnv({ ...OK, OWNER_EMAIL: 'Dono@Example.com ' });
    expect(env.OWNER_EMAIL).toBe('dono@example.com');
  });

  it('aceita postgresql://', () => {
    expect(() => loadEnv({ ...OK, DATABASE_URL: 'postgresql://u:p@h:5432/db' })).not.toThrow();
  });

  it('lança sem OWNER_EMAIL, citando o nome', () => {
    expect(mensagem({ DATABASE_URL: OK.DATABASE_URL })).toContain('OWNER_EMAIL');
  });

  it('lança sem as duas, citando os dois nomes', () => {
    const m = mensagem({});
    expect(m).toContain('DATABASE_URL');
    expect(m).toContain('OWNER_EMAIL');
  });

  it('não vaza o valor de DATABASE_URL inválida', () => {
    const m = mensagem({ ...OK, DATABASE_URL: 'http://segredo123@x' });
    expect(m).toContain('DATABASE_URL');
    expect(m).not.toContain('segredo123');
  });

  it('não vaza o valor de OWNER_EMAIL inválido', () => {
    const m = mensagem({ ...OK, OWNER_EMAIL: 'nao-e-email' });
    expect(m).toContain('OWNER_EMAIL');
    expect(m).not.toContain('nao-e-email');
  });

  it('CRON_SECRET curto lança sem vazar o valor', () => {
    const m = mensagem({ ...OK, CRON_SECRET: 'curto' });
    expect(m).toContain('CRON_SECRET');
    expect(m).not.toContain('curto');
  });

  it('CRON_SECRET ausente é aceito', () => {
    expect(() => loadEnv(OK)).not.toThrow();
  });

  it('CRON_SECRET com 32 caracteres é aceito', () => {
    expect(() => loadEnv({ ...OK, CRON_SECRET: 'x'.repeat(32) })).not.toThrow();
  });

  it('SUPABASE_URL exige https', () => {
    const m = mensagem({ ...OK, SUPABASE_URL: 'http://x.supabase.co' });
    expect(m).toContain('SUPABASE_URL');
  });

  it('DATABASE_URL_MIGRATIONS inválida lança', () => {
    expect(mensagem({ ...OK, DATABASE_URL_MIGRATIONS: 'mysql://x' })).toContain(
      'DATABASE_URL_MIGRATIONS',
    );
  });

  it('string vazia conta como ausente (opcional) ou inválida (obrigatória)', () => {
    expect(() => loadEnv({ ...OK, CRON_SECRET: '' })).not.toThrow();
    expect(mensagem({ ...OK, OWNER_EMAIL: '' })).toContain('OWNER_EMAIL');
  });
});
