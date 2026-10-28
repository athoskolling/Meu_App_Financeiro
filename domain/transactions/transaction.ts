import type { Cents } from '../money';

export type TransactionSource = 'open_finance' | 'caju_ocr' | 'manual';

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'credit_card_purchase'
  | 'credit_card_payment'
  | 'refund'
  | 'investment'
  | 'other';

export type TransactionStatus = 'pending' | 'posted';

export interface NormalizedTransaction {
  source: TransactionSource;
  /** Identificador estável da conta (string opaca). */
  accountRef: string;
  /** Só uma dica; nunca a identidade sozinha. */
  externalId?: string;
  /** Data civil "YYYY-MM-DD", sem fuso. */
  date: string;
  /** "HH:mm" quando existir. */
  time?: string;
  postedAt?: string;
  description: string;
  merchantName?: string;
  /** Com sinal: entrada positiva, saída negativa. */
  amount: Cents;
  currency: 'BRL';
  type: TransactionType;
  status: TransactionStatus;
}

export type ProblemCode =
  | 'invalid_source'
  | 'empty_account_ref'
  | 'invalid_date'
  | 'invalid_time'
  | 'invalid_posted_at'
  | 'empty_description'
  | 'invalid_amount'
  | 'zero_amount'
  | 'sign_mismatch'
  | 'invalid_currency'
  | 'invalid_type'
  | 'invalid_status';

/** Só código, campo e severidade: sem descrição nem valores (logs sem dados). */
export interface Problem {
  code: ProblemCode;
  field: keyof NormalizedTransaction;
  severity: 'error' | 'warning';
}

/** `ok` é verdadeiro quando não há problema de severidade 'error'. */
export interface ValidationResult {
  ok: boolean;
  problems: Problem[];
}

const SOURCES: readonly unknown[] = ['open_finance', 'caju_ocr', 'manual'];
const STATUSES: readonly unknown[] = ['pending', 'posted'];

/** Tipos cujo valor deve ser negativo (saída) ou positivo (entrada). */
const NEGATIVE_TYPES: readonly unknown[] = ['expense', 'credit_card_purchase'];
const POSITIVE_TYPES: readonly unknown[] = ['income', 'refund'];
const FREE_SIGN_TYPES: readonly unknown[] = [
  'transfer',
  'investment',
  'credit_card_payment',
  'other',
];

const DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_SHAPE = /^(\d{2}):(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Data civil válida "YYYY-MM-DD", por aritmética (sem Date). */
function isCivilDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const m = DATE_SHAPE.exec(value);
  if (m === null) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

function isTime(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const m = TIME_SHAPE.exec(value);
  if (m === null) return false;
  return Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * Devolve todos os problemas da transação, na ordem dos campos do contrato.
 * Não lança por regra de negócio e não muta a entrada. A entrada pode vir de
 * fonte não confiável, então os campos que o tipo garante também são conferidos.
 */
export function validateTransaction(t: NormalizedTransaction): ValidationResult {
  const problems: Problem[] = [];
  const error = (code: ProblemCode, field: Problem['field']): void => {
    problems.push({ code, field, severity: 'error' });
  };

  // Entrada que não é objeto (null, undefined, texto, número, array) é tratada
  // como objeto vazio: não lança e produz os problemas dos campos obrigatórios.
  const input: unknown = t;
  const src: Partial<Record<keyof NormalizedTransaction, unknown>> =
    typeof input === 'object' && input !== null && !Array.isArray(input) ? input : {};

  // Cada campo é lido uma única vez.
  const source = src.source;
  const accountRef = src.accountRef;
  const date = src.date;
  const time = src.time;
  const postedAt = src.postedAt;
  const description = src.description;
  const amount = src.amount;
  const currency = src.currency;
  const type = src.type;
  const status = src.status;

  if (!SOURCES.includes(source)) error('invalid_source', 'source');
  if (isBlank(accountRef)) error('empty_account_ref', 'accountRef');
  if (!isCivilDate(date)) error('invalid_date', 'date');
  if (time !== undefined && !isTime(time)) error('invalid_time', 'time');
  if (postedAt !== undefined && !isCivilDate(postedAt)) {
    error('invalid_posted_at', 'postedAt');
  }
  if (isBlank(description)) error('empty_description', 'description');

  if (typeof amount !== 'number' || !Number.isSafeInteger(amount)) {
    error('invalid_amount', 'amount');
  } else if (amount === 0) {
    problems.push({ code: 'zero_amount', field: 'amount', severity: 'warning' });
  } else {
    const mismatch =
      (amount > 0 && NEGATIVE_TYPES.includes(type)) ||
      (amount < 0 && POSITIVE_TYPES.includes(type));
    if (mismatch) error('sign_mismatch', 'amount');
  }

  if (currency !== 'BRL') error('invalid_currency', 'currency');
  if (
    !NEGATIVE_TYPES.includes(type) &&
    !POSITIVE_TYPES.includes(type) &&
    !FREE_SIGN_TYPES.includes(type)
  ) {
    error('invalid_type', 'type');
  }
  if (!STATUSES.includes(status)) error('invalid_status', 'status');

  return { ok: !problems.some((p) => p.severity === 'error'), problems };
}
