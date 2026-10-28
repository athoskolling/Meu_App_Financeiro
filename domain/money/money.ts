// Dinheiro em centavos inteiros (ADR-0018, itens 1 a 4).
// Domínio puro: sem imports, sem API de formatação por locale, sem float. As mensagens de erro ajudam a
// corrigir o problema, mas nunca repetem a entrada (erros acabam em log).

export type Cents = number & { readonly __brand: 'Cents' };

export type MoneyErrorCode =
  'empty' | 'invalid_format' | 'ambiguous_format' | 'out_of_range' | 'not_integer';

export class MoneyError extends Error {
  readonly code: MoneyErrorCode;

  constructor(code: MoneyErrorCode, message: string) {
    super(message);
    this.name = 'MoneyError';
    this.code = code;
  }
}

const MAX_SAFE_DIGITS = '9007199254740991';
const MAX_SAFE_BIGINT = 9007199254740991n;

/** Único jeito de criar Cents a partir de number. `-0` vira `0`. */
export function cents(value: number): Cents {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new MoneyError('not_integer', 'o valor em centavos precisa ser um número inteiro');
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError('out_of_range', 'o valor em centavos está fora da faixa suportada');
  }
  return (value === 0 ? 0 : value) as Cents;
}

/** Recebe só dígitos (sem sinal) e confere a faixa antes de converter. */
function digitsToNumber(digits: string): number {
  const trimmed = digits.replace(/^0+(?=\d)/, '');
  const outOfRange =
    trimmed.length > MAX_SAFE_DIGITS.length ||
    (trimmed.length === MAX_SAFE_DIGITS.length && trimmed > MAX_SAFE_DIGITS);
  if (outOfRange) {
    throw new MoneyError('out_of_range', 'o valor está fora da faixa suportada');
  }
  return Number(trimmed);
}

const SPACE = '[ \\u00a0\\u202f]*';
const SIGN_PREFIX = new RegExp(`^(?:([+-])${SPACE})?(?:R\\$${SPACE})?(?:([+-])${SPACE})?(.*)$`);
const PAREN_BODY = new RegExp(`^\\((?:R\\$${SPACE})?(.*)\\)$`);
const BODY = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/;
const BODY_CHARS = /^[\d.,]+$/;

function invalidFormat(): MoneyError {
  return new MoneyError(
    'invalid_format',
    'formato inválido; use o formato brasileiro, com ponto no milhar e vírgula nos centavos',
  );
}

function convertBody(body: string): number {
  if (BODY_CHARS.test(body)) {
    const lastComma = body.lastIndexOf(',');
    const lastDot = body.lastIndexOf('.');
    if (lastComma !== -1 && lastDot > lastComma) {
      throw new MoneyError(
        'ambiguous_format',
        'formato americano não é aceito; use ponto no milhar e vírgula nos centavos',
      );
    }
  }
  const match = BODY.exec(body);
  if (match === null) throw invalidFormat();
  const whole = (match[1] ?? '').replaceAll('.', '');
  const fraction = (match[2] ?? '').padEnd(2, '0');
  return digitsToNumber(whole + fraction);
}

/**
 * Lê um valor em BRL (`1.234,56`, `R$ 12,30`, `-R$ 12,30`, `(12,30)`).
 * Entrada que não é texto lança `invalid_format`. `trim()` também remove tab, quebra de linha e BOM;
 * o que sobrar passa pela gramática abaixo, que recusa o que não reconhece.
 */
export function parseBRL(input: string): Cents {
  if (typeof input !== 'string') {
    throw new MoneyError('invalid_format', 'o valor precisa ser um texto');
  }
  const text = input.trim();
  if (text === '') {
    throw new MoneyError('empty', 'o valor está vazio');
  }

  const paren = PAREN_BODY.exec(text);
  if (paren !== null) {
    return cents(-convertBody(paren[1] ?? ''));
  }

  const match = SIGN_PREFIX.exec(text);
  const sign1 = match?.[1];
  const sign2 = match?.[2];
  if (match === null || (sign1 !== undefined && sign2 !== undefined)) {
    throw invalidFormat();
  }
  const magnitude = convertBody(match[3] ?? '');
  const negative = (sign1 ?? sign2) === '-';
  return cents(negative ? -magnitude : magnitude);
}

function groupThousands(digits: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return out;
}

/** Formata como `R$ 1.234,56` ou `-R$ 12,30`. Só espaço comum. */
export function formatBRL(value: Cents): string {
  const safe = cents(value);
  const digits = String(safe < 0 ? 0 - safe : safe).padStart(3, '0');
  const whole = digits.slice(0, -2);
  const fraction = digits.slice(-2);
  return `${safe < 0 ? '-' : ''}R$ ${groupThousands(whole)},${fraction}`;
}

/** Borda com o driver do banco: texto, bigint ou number viram Cents com checagem de faixa. */
export function fromDb(value: string | number | bigint): Cents {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    throw new MoneyError('invalid_format', 'o valor do banco precisa ser texto, número ou bigint');
  }
  if (typeof value === 'number') return cents(value);

  if (typeof value === 'bigint') {
    if (value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT) {
      throw new MoneyError('out_of_range', 'o valor do banco está fora da faixa suportada');
    }
    return cents(Number(value));
  }

  const match = /^(-?)(\d+)$/.exec(value);
  if (match === null) {
    throw new MoneyError('invalid_format', 'o valor do banco precisa ser um inteiro em texto');
  }
  const magnitude = digitsToNumber(match[2] ?? '');
  return cents(match[1] === '-' ? -magnitude : magnitude);
}

/** Soma dois valores; valida os operandos e o resultado (fora da faixa lança `out_of_range`). */
export function add(a: Cents, b: Cents): Cents {
  return cents(cents(a) + cents(b));
}

/** Soma em sequência, checando a faixa a cada passo. */
export function sum(values: readonly Cents[]): Cents {
  const list: unknown = values;
  if (!Array.isArray(list)) {
    throw new MoneyError('invalid_format', 'a lista de valores precisa ser um array');
  }
  let total = cents(0);
  for (const value of values) {
    total = add(total, value);
  }
  return total;
}

/** Inverte o sinal; `negate(0)` continua `0`. */
export function negate(value: Cents): Cents {
  return cents(0 - value);
}
