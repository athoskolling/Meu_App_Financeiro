import { z } from 'zod';

// Variáveis de ambiente (spec 14, ADR-0019). Só DATABASE_URL e OWNER_EMAIL são obrigatórias
// na T2.1; as outras viram obrigatórias no cartão que as usa, mas já são validadas se presentes.
// Mensagens de erro citam só o NOME da variável, nunca o valor.

const AUSENTE = 'ausente';
const INVALIDO = 'formato inválido';

/** String vazia conta como ausente (`VAR=` no .env.example). */
const vazioViraAusente = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const urlPostgres = z
  .string({ error: AUSENTE })
  .refine((v) => /^postgres(ql)?:\/\//.test(v) && URL.canParse(v), { error: INVALIDO });

const urlHttps = z
  .string({ error: AUSENTE })
  .refine((v) => v.startsWith('https://') && URL.canParse(v), { error: INVALIDO });

const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(vazioViraAusente, schema.optional());

const schema = z.object({
  DATABASE_URL: z.preprocess(vazioViraAusente, urlPostgres),
  OWNER_EMAIL: z.preprocess(
    (v) => (typeof v === 'string' ? vazioViraAusente(v.trim()) : v),
    z
      .string({ error: AUSENTE })
      .transform((v) => v.toLowerCase())
      .pipe(z.email({ error: INVALIDO })),
  ),
  DATABASE_URL_MIGRATIONS: opcional(urlPostgres),
  SUPABASE_URL: opcional(urlHttps),
  SUPABASE_ANON_KEY: opcional(z.string({ error: INVALIDO }).min(1, { error: INVALIDO })),
  CRON_SECRET: opcional(z.string({ error: INVALIDO }).min(32, { error: INVALIDO })),
  PLUGGY_CLIENT_ID: opcional(z.string({ error: INVALIDO }).min(1, { error: INVALIDO })),
  PLUGGY_CLIENT_SECRET: opcional(z.string({ error: INVALIDO }).min(1, { error: INVALIDO })),
});

export type Env = z.infer<typeof schema>;

/** Valida as variáveis e devolve o objeto tipado. Pura: não lê process.env sozinha. */
export function loadEnv(source: Record<string, string | undefined>): Env {
  const resultado = schema.safeParse(source);
  if (resultado.success) return resultado.data;

  const motivos = new Map<string, string>();
  for (const issue of resultado.error.issues) {
    const nome = String(issue.path[0] ?? '?');
    // Só o motivo genérico: nunca repassa texto do Zod, que poderia ecoar o valor.
    const motivo = issue.message === AUSENTE ? AUSENTE : INVALIDO;
    if (!motivos.has(nome)) motivos.set(nome, motivo);
  }
  const lista = [...motivos].map(([nome, motivo]) => `${nome} (${motivo})`).join(', ');
  throw new Error(`Variáveis de ambiente com problema: ${lista}. Veja o .env.example.`);
}

let cache: Env | undefined;

/** Lê process.env uma única vez e guarda o resultado. */
export function env(): Env {
  cache ??= loadEnv(process.env);
  return cache;
}
