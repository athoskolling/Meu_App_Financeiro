import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

// Cliente de banco SÓ DE SERVIDOR (ADR-0021). `prepare: false` é exigido pelo pooler do
// Supabase em modo transação (porta 6543, spec 6). A conexão é criada na primeira chamada.

let cache: ReturnType<typeof criar> | undefined;

function criar() {
  const conexao = postgres(env().DATABASE_URL, { prepare: false });
  return drizzle(conexao, { schema });
}

export function db() {
  cache ??= criar();
  return cache;
}
