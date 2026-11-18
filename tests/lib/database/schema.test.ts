import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Teste estático: lê os .sql de drizzle/ (sem banco).

const DIR = join(import.meta.dirname, '..', '..', '..', 'drizzle');
const arquivos = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const sqls = arquivos.map((f) => readFileSync(join(DIR, f), 'utf8'));
const sql = sqls.join('\n');

const TABELAS = [
  'users',
  'institutions',
  'connections',
  'accounts',
  'transactions',
  'categories',
  'merchant_rules',
  'imports',
  'import_items',
  'holdings',
  'sync_logs',
];

/** Corpo do CREATE TABLE da tabela. */
function corpo(tabela: string): string {
  const m = new RegExp(`CREATE TABLE "${tabela}" \\(([\\s\\S]*?)\\n\\);`).exec(sql);
  if (!m) throw new Error(`CREATE TABLE ausente: ${tabela}`);
  return m[1] ?? '';
}

function coluna(tabela: string, nome: string): string {
  const linha = corpo(tabela)
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`"${nome}" `));
  if (!linha) throw new Error(`coluna ausente: ${tabela}.${nome}`);
  return linha;
}

describe('migrações (estático)', () => {
  it('há ao menos uma migração', () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it.each(TABELAS)('cria a tabela %s', (t) => {
    expect(sql).toContain(`CREATE TABLE "${t}"`);
  });

  it.each(TABELAS)('%s tem ENABLE e FORCE ROW LEVEL SECURITY', (t) => {
    expect(sql).toContain(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;`);
    expect(sql).toContain(`ALTER TABLE "${t}" FORCE ROW LEVEL SECURITY;`);
  });

  it('nenhuma migração contém CREATE POLICY', () => {
    for (const s of sqls) expect(s).not.toMatch(/CREATE\s+POLICY/i);
  });

  it('transactions.identity_key é NOT NULL e há índice único (account_id, identity_key)', () => {
    expect(coluna('transactions', 'identity_key')).toMatch(/NOT NULL/);
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "[^"]+" ON "transactions" USING btree \("account_id","identity_key"\)/,
    );
  });

  it('transactions.deleted_at é anulável', () => {
    expect(coluna('transactions', 'deleted_at')).not.toMatch(/NOT NULL/);
  });

  it.each([
    ['transactions', 'amount'],
    ['accounts', 'balance'],
    ['accounts', 'available_balance'],
    ['accounts', 'reconciliation_diff'],
    ['holdings', 'balance'],
    ['import_items', 'parsed_amount'],
  ])('%s.%s é bigint', (t, c) => {
    expect(coluna(t, c)).toMatch(/^"[a-z_]+" bigint\b/);
  });

  it('nenhum tipo de ponto flutuante, numeric ou money no schema', () => {
    expect(sql).not.toMatch(/\b(real|double precision|numeric|decimal|money|float\d?)\b/i);
  });

  it.each([
    ['transactions', 'date'],
    ['imports', 'period_start'],
    ['imports', 'period_end'],
  ])('%s.%s é date', (t, c) => {
    expect(coluna(t, c)).toMatch(/^"[a-z_]+" date\b/);
  });

  it.each(TABELAS.filter((t) => t !== 'institutions' && t !== 'import_items'))(
    '%s tem user_id',
    (t) => {
      // users é a própria tabela do usuário: o id faz esse papel.
      if (t === 'users') return;
      expect(coluna(t, 'user_id')).toMatch(/uuid NOT NULL/);
    },
  );

  it('import_items liga-se a imports por FK', () => {
    expect(coluna('import_items', 'import_id')).toMatch(/uuid NOT NULL/);
  });

  it('todas as FKs são ON DELETE restrict', () => {
    const fks = sql.match(/FOREIGN KEY[^;]*?;/g) ?? [];
    expect(fks.length).toBeGreaterThan(0);
    for (const fk of fks) expect(fk).toMatch(/ON DELETE restrict/);
  });
});
