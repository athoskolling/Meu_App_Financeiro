// Gastos do período (ADR-0020, itens 1 a 8). Única função que responde "quanto gastei".
// Somas sempre pelas funções de domain/money; datas comparadas como texto (YYYY-MM-DD).

import { daysBetween, type Period } from '../dates';
import { add, cents, negate, type Cents } from '../money';
import { validateTransaction, type NormalizedTransaction } from '../transactions';

export interface SpendingItem {
  tx: NormalizedTransaction;
  isTransfer: boolean;
}

export interface SpendingSummary {
  /** Compras + despesas - estornos (em módulo; pode ser negativo). */
  expenses: Cents;
  income: Cents;
  /** income - expenses. */
  net: Cents;
  /** Em módulo, só informativo. */
  cardPayments: Cents;
  /** Em módulo. */
  investedOut: Cents;
  /** Em módulo. */
  investedIn: Cents;
  transfers: { count: number };
  /** `total` com sinal. */
  unclassified: { count: number; total: Cents };
}

/**
 * Soma o período fechado `[start, end]`. Não muta a entrada e não depende da ordem.
 * Linha inválida ou período inválido é erro de programação e lança `Error` (sem ecoar valores).
 */
export function spendingForPeriod(items: readonly SpendingItem[], period: Period): SpendingSummary {
  // Valida o período (datas civis) e a ordem start <= end.
  if (daysBetween(period.start, period.end) < 0) {
    throw new Error('período inválido: início depois do fim');
  }

  let expenses = cents(0);
  let income = cents(0);
  let cardPayments = cents(0);
  let investedOut = cents(0);
  let investedIn = cents(0);
  let transfersCount = 0;
  let unclassifiedCount = 0;
  let unclassifiedTotal = cents(0);

  for (const { tx, isTransfer } of items) {
    if (!validateTransaction(tx).ok) {
      throw new Error('transação inválida: valide antes de calcular o período');
    }
    if (tx.date < period.start || tx.date > period.end) continue;
    if (isTransfer) {
      transfersCount += 1;
      continue;
    }

    switch (tx.type) {
      case 'expense':
      case 'credit_card_purchase':
      case 'refund': // estorno é positivo: negate() o subtrai das despesas
        expenses = add(expenses, negate(tx.amount));
        break;
      case 'income':
        income = add(income, tx.amount);
        break;
      case 'credit_card_payment':
        cardPayments = add(cardPayments, tx.amount < 0 ? negate(tx.amount) : tx.amount);
        break;
      case 'investment':
        if (tx.amount < 0) investedOut = add(investedOut, negate(tx.amount));
        else investedIn = add(investedIn, tx.amount);
        break;
      case 'transfer':
      case 'other':
        unclassifiedCount += 1;
        unclassifiedTotal = add(unclassifiedTotal, tx.amount);
        break;
    }
  }

  return {
    expenses,
    income,
    net: add(income, negate(expenses)),
    cardPayments,
    investedOut,
    investedIn,
    transfers: { count: transfersCount },
    unclassified: { count: unclassifiedCount, total: unclassifiedTotal },
  };
}
