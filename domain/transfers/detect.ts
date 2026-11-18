// Transferências internas (ADR-0020, itens 9 a 12). Puro e determinístico:
// o resultado não depende da ordem de entrada.

import { daysBetween } from '../dates';
import { baseKeyInput, type NormalizedTransaction, type TransactionType } from '../transactions';

export interface TransferMatch {
  outflowIndex: number;
  inflowIndex: number;
  /** Sempre >= 0. */
  daysApart: number;
  confidence: 'high' | 'medium';
}

const MATCHABLE: readonly TransactionType[] = ['transfer', 'expense', 'income', 'other'];

interface Candidate {
  match: TransferMatch;
  outDate: string;
  inDate: string;
  outText: string;
  inText: string;
}

function canonical(tx: NormalizedTransaction): string {
  return baseKeyInput(tx) + (tx.externalId ?? '');
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareCandidates(a: Candidate, b: Candidate): number {
  return (
    a.match.daysApart - b.match.daysApart ||
    compareText(a.outDate, b.outDate) ||
    compareText(a.inDate, b.inDate) ||
    compareText(a.outText, b.outText) ||
    compareText(a.inText, b.inText) ||
    a.match.outflowIndex - b.match.outflowIndex ||
    a.match.inflowIndex - b.match.inflowIndex
  );
}

/**
 * Pares (saída, entrada) entre contas diferentes, mesmo valor em módulo, dentro de `windowDays`.
 * Desempate guloso (ADR-0020, item 11). Saída ordenada por `outflowIndex`.
 * `windowDays` inválido lança `Error`.
 */
export function detectTransfers(
  txs: readonly NormalizedTransaction[],
  opts: { windowDays: number },
): TransferMatch[] {
  const { windowDays } = opts;
  if (!Number.isInteger(windowDays) || windowDays < 0) {
    throw new Error('windowDays inválido: use um inteiro maior ou igual a zero');
  }

  const texts = txs.map(canonical);
  const candidates: Candidate[] = [];
  txs.forEach((out, i) => {
    if (out.amount >= 0 || !MATCHABLE.includes(out.type)) return;
    txs.forEach((inn, j) => {
      if (inn.amount <= 0 || !MATCHABLE.includes(inn.type)) return;
      if (out.accountRef === inn.accountRef || out.amount !== -inn.amount) return;
      const daysApart = Math.abs(daysBetween(out.date, inn.date));
      if (daysApart > windowDays) return;
      const bothTransfer = out.type === 'transfer' && inn.type === 'transfer';
      candidates.push({
        match: {
          outflowIndex: i,
          inflowIndex: j,
          daysApart,
          confidence: bothTransfer && daysApart <= 1 ? 'high' : 'medium',
        },
        outDate: out.date,
        inDate: inn.date,
        outText: texts[i] ?? '',
        inText: texts[j] ?? '',
      });
    });
  });

  candidates.sort(compareCandidates);
  const usedOut = new Set<number>();
  const usedIn = new Set<number>();
  const result: TransferMatch[] = [];
  for (const { match } of candidates) {
    if (usedOut.has(match.outflowIndex) || usedIn.has(match.inflowIndex)) continue;
    usedOut.add(match.outflowIndex);
    usedIn.add(match.inflowIndex);
    result.push(match);
  }
  return result.sort((a, b) => a.outflowIndex - b.outflowIndex);
}
