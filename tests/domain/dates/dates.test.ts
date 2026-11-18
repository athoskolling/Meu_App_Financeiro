import { describe, expect, it } from 'vitest';
import { daysBetween, daysInMonth, monthPeriod } from '../../../domain/dates';

describe('daysInMonth', () => {
  it('fevereiro em ano bissexto tem 29 dias', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it('fevereiro em ano comum tem 28 dias (1900 não é bissexto)', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
  });

  it('meses de 30 e de 31 dias', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('mês ou ano inválido lança Error', () => {
    expect(() => daysInMonth(2026, 0)).toThrow(Error);
    expect(() => daysInMonth(2026, 13)).toThrow(Error);
    expect(() => daysInMonth(2026, 1.5)).toThrow(Error);
    expect(() => daysInMonth(Number.NaN, 1)).toThrow(Error);
  });
});

describe('daysBetween', () => {
  it('virada de mês', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
  });

  it('atravessa fevereiro bissexto', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('pode ser negativo', () => {
    expect(daysBetween('2026-11-01', '2026-10-31')).toBe(-1);
  });

  it('virada de ano', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('um ano comum tem 365 dias', () => {
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('mesma data dá zero', () => {
    expect(daysBetween('2026-10-06', '2026-10-06')).toBe(0);
  });

  it('data inválida lança Error', () => {
    expect(() => daysBetween('2026-02-30', '2026-03-01')).toThrow(Error);
    expect(() => daysBetween('2026-03-01', '2026-13-01')).toThrow(Error);
    expect(() => daysBetween('2026-3-1', '2026-03-01')).toThrow(Error);
    expect(() => daysBetween('', '2026-03-01')).toThrow(Error);
  });

  it('a mensagem de erro não ecoa a entrada', () => {
    expect(() => daysBetween('lixo-secreto', '2026-03-01')).toThrow(/^(?!.*lixo-secreto)/);
  });
});

describe('monthPeriod', () => {
  it('mês de 31 dias', () => {
    expect(monthPeriod('2026-10')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
  });

  it('fevereiro bissexto', () => {
    expect(monthPeriod('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });

  it('fevereiro comum', () => {
    expect(monthPeriod('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('formato ou mês inválido lança Error', () => {
    expect(() => monthPeriod('2026-13')).toThrow(Error);
    expect(() => monthPeriod('2026-00')).toThrow(Error);
    expect(() => monthPeriod('26-10')).toThrow(Error);
    expect(() => monthPeriod('2026-10-01')).toThrow(Error);
  });
});
