// Categorizador (ADR-0020, itens 13 a 17). Puro e determinístico.
// Ordem: tipo -> regra do usuário -> estabelecimento conhecido -> categoria da fonte -> heurística -> Outros.

import { normalizeText, type NormalizedTransaction } from '../transactions';

export interface Rule {
  pattern: string;
  categoryId: string;
}

export interface CategorizeContext {
  userRules: readonly Rule[];
  knownMerchants: readonly Rule[];
  /** Categoria da fonte -> categoryId. */
  sourceCategoryMap: ReadonlyMap<string, string>;
  heuristics: readonly Rule[];
  investmentCategoryId: string;
  transferCategoryId: string;
  /** "Outros". */
  fallbackCategoryId: string;
}

export type CategoryReason =
  'type' | 'user_rule' | 'known_merchant' | 'source_category' | 'heuristic' | 'fallback';

export interface CategoryResult {
  categoryId: string;
  reason: CategoryReason;
  pattern?: string;
}

/** Melhor regra: casa por palavra inteira; vence o padrão normalizado mais longo; empate, o primeiro. */
function bestMatch(rules: readonly Rule[], texts: readonly string[]): Rule | undefined {
  let best: { rule: Rule; length: number } | undefined;
  for (const rule of rules) {
    const pattern = normalizeText(rule.pattern);
    if (pattern === '') continue;
    const needle = ` ${pattern} `;
    if (!texts.some((text) => ` ${text} `.includes(needle))) continue;
    if (best === undefined || pattern.length > best.length) {
      best = { rule, length: pattern.length };
    }
  }
  return best?.rule;
}

export function categorize(
  input: { tx: NormalizedTransaction; sourceCategory?: string },
  ctx: CategorizeContext,
): CategoryResult {
  const { tx, sourceCategory } = input;

  if (tx.type === 'investment') return { categoryId: ctx.investmentCategoryId, reason: 'type' };
  if (tx.type === 'credit_card_payment' || tx.type === 'transfer') {
    return { categoryId: ctx.transferCategoryId, reason: 'type' };
  }

  const texts = [tx.description, tx.merchantName ?? ''].map(normalizeText);

  const user = bestMatch(ctx.userRules, texts);
  if (user !== undefined) {
    return {
      categoryId: user.categoryId,
      reason: 'user_rule',
      pattern: normalizeText(user.pattern),
    };
  }

  const known = bestMatch(ctx.knownMerchants, texts);
  if (known !== undefined) {
    return {
      categoryId: known.categoryId,
      reason: 'known_merchant',
      pattern: normalizeText(known.pattern),
    };
  }

  if (sourceCategory !== undefined) {
    const mapped = ctx.sourceCategoryMap.get(sourceCategory);
    if (mapped !== undefined) return { categoryId: mapped, reason: 'source_category' };
  }

  const heuristic = bestMatch(ctx.heuristics, texts);
  if (heuristic !== undefined) {
    return {
      categoryId: heuristic.categoryId,
      reason: 'heuristic',
      pattern: normalizeText(heuristic.pattern),
    };
  }

  return { categoryId: ctx.fallbackCategoryId, reason: 'fallback' };
}
