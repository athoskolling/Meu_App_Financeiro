import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Integração: exige um Postgres VAZIO em TEST_DATABASE_URL. O CI ainda não tem Postgres
// (T2.2), por isso o describe é pulado quando a variável não existe. Sem URL em código.
const url = process.env.TEST_DATABASE_URL;

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

describe.skipIf(!url)('migração em Postgres real (requer TEST_DATABASE_URL)', () => {
  const conexao = postgres(url ?? 'postgresql://invalido', { prepare: false, max: 1 });
  const pasta = join(import.meta.dirname, '..', '..', 'drizzle');

  beforeAll(async () => {
    await migrate(drizzle(conexao), { migrationsFolder: pasta });
  });

  afterAll(async () => {
    await conexao.end();
  });

  it('cria as 11 tabelas', async () => {
    const linhas = await conexao`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    const nomes = linhas.map((l) => String(l.table_name));
    for (const t of TABELAS) expect(nomes).toContain(t);
  });

  it('RLS ligado e forçado em todas as tabelas', async () => {
    const linhas = await conexao`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY(${TABELAS})`;
    expect(linhas).toHaveLength(TABELAS.length);
    for (const l of linhas) {
      expect(l.relrowsecurity).toBe(true);
      expect(l.relforcerowsecurity).toBe(true);
    }
  });

  it('segunda transação com mesmo (account_id, identity_key) viola unicidade (23505)', async () => {
    const [u] = await conexao`INSERT INTO users (email) VALUES ('teste@example.com') RETURNING id`;
    const [i] = await conexao`
      INSERT INTO institutions (name, slug) VALUES ('Banco Teste', 'banco-teste') RETURNING id`;
    const [a] = await conexao`
      INSERT INTO accounts (user_id, institution_id, name, type)
      VALUES (${u!.id as string}, ${i!.id as string}, 'Conta Teste', 'checking') RETURNING id`;
    const inserir = () => conexao`
      INSERT INTO transactions (user_id, account_id, identity_key, source, date, description, amount)
      VALUES (${u!.id as string}, ${a!.id as string}, 'chave-1', 'manual', '2026-01-15', 'Teste', -1000)`;
    await inserir();
    await expect(inserir()).rejects.toMatchObject({ code: '23505' });
  });

  it('aplicar de novo não faz nada e não falha', async () => {
    await expect(migrate(drizzle(conexao), { migrationsFolder: pasta })).resolves.toBeUndefined();
    const linhas = await conexao`SELECT id FROM drizzle.__drizzle_migrations`;
    expect(linhas).toHaveLength(2);
  });
});
