// Log seguro (spec 14, ADR-0019): uma linha JSON por chamada, só com chaves permitidas.
// Nunca registra valores, descrições, mensagens de erro nem stack.

const CHAVES_PERMITIDAS = [
  'requestId',
  'accountId',
  'importId',
  'syncId',
  'count',
  'durationMs',
  'code',
  'status',
  'source',
  'stage',
  'attempt',
] as const;

type Chave = (typeof CHAVES_PERMITIDAS)[number];
type Valor = number | boolean | null | string;

export type LogFields = Partial<Record<Chave, Valor>>;

const MAX_STRING = 64;

export interface LoggerDeps {
  now: () => string;
  write: (line: string) => void;
}

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, error?: unknown, fields?: LogFields): void;
}

function valorAceito(v: unknown): v is Valor {
  if (v === null || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  return typeof v === 'string' && v.length <= MAX_STRING;
}

function filtrar(fields: object | undefined): { kept: Record<string, Valor>; dropped: number } {
  const kept: Record<string, Valor> = {};
  let dropped = 0;
  for (const [chave, valor] of Object.entries(fields ?? {})) {
    if ((CHAVES_PERMITIDAS as readonly string[]).includes(chave) && valorAceito(valor)) {
      kept[chave] = valor;
    } else {
      dropped++;
    }
  }
  return { kept, dropped };
}

function dadosDoErro(error: unknown): Record<string, string> {
  if (!(error instanceof Error)) return { errorName: 'unknown' };
  const dados: Record<string, string> = { errorName: error.name };
  const code: unknown = (error as { code?: unknown }).code;
  if (typeof code === 'string' && code.length <= MAX_STRING) dados.errorCode = code;
  return dados;
}

export function createLogger({ now, write }: LoggerDeps): Logger {
  const emit = (
    level: 'info' | 'warn' | 'error',
    event: string,
    extra: Record<string, string>,
    fields: LogFields | undefined,
  ) => {
    const { kept, dropped } = filtrar(fields);
    const linha: Record<string, unknown> = { ts: now(), level, event, ...extra, ...kept };
    if (dropped > 0) linha.droppedKeys = dropped;
    write(JSON.stringify(linha));
  };
  return {
    info: (event, fields) => emit('info', event, {}, fields),
    warn: (event, fields) => emit('warn', event, {}, fields),
    error: (event, error, fields) => emit('error', event, dadosDoErro(error), fields),
  };
}

function escreverNoConsole(line: string): void {
  // O erro vai para stderr; info e warn para stdout (a linha já traz o level).
  const { level } = JSON.parse(line) as { level: string };
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const log: Logger = createLogger({
  now: () => new Date().toISOString(),
  write: escreverNoConsole,
});
