import { defineConfig } from 'drizzle-kit';

// Só o script de migração exige DATABASE_URL_MIGRATIONS (pooler em modo sessão, porta 5432).
// A mensagem nomeia a variável, nunca o valor.
const url = process.env.DATABASE_URL_MIGRATIONS;
if (!url) {
  throw new Error(
    'Variável de ambiente ausente: DATABASE_URL_MIGRATIONS (necessária para migrar).',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});
