// Datas civis "YYYY-MM-DD" por aritmética (ADR-0020, item 18). Sem Date, sem fuso.
// As mensagens de erro nunca repetem a entrada (erros acabam em log).

/** Intervalo fechado de datas civis: `start` e `end` inclusos. */
export interface Period {
  start: string;
  end: string;
}

const DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_SHAPE = /^(\d{4})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Dias do mês (`month` de 1 a 12). Argumento inválido lança `Error`. */
export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('daysInMonth: ano ou mês inválido');
  }
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Dias desde 0000-03-01 (algoritmo de data civil proléptica), sem Date. */
function toDayNumber(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const shifted = month > 2 ? month - 3 : month + 9;
  const dayOfYear = Math.floor((153 * shifted + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra;
}

function parseCivilDate(value: string): number {
  const m = typeof value === 'string' ? DATE_SHAPE.exec(value) : null;
  if (m === null) throw new Error('data civil inválida: use o formato YYYY-MM-DD');
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error('data civil inválida: dia ou mês fora do calendário');
  }
  return toDayNumber(year, month, day);
}

/** `b - a` em dias; negativo quando `b` é anterior a `a`. Data inválida lança `Error`. */
export function daysBetween(a: string, b: string): number {
  return parseCivilDate(b) - parseCivilDate(a);
}

/** Primeiro e último dia do mês `YYYY-MM`. Formato ou mês inválido lança `Error`. */
export function monthPeriod(yyyyMm: string): Period {
  const m = typeof yyyyMm === 'string' ? MONTH_SHAPE.exec(yyyyMm) : null;
  if (m === null) throw new Error('mês inválido: use o formato YYYY-MM');
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 1 || month < 1 || month > 12) throw new Error('mês inválido: fora do calendário');
  return {
    start: `${m[1]}-${m[2]}-01`,
    end: `${m[1]}-${m[2]}-${String(daysInMonth(year, month)).padStart(2, '0')}`,
  };
}
