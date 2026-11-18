import type { NormalizedTransaction } from './transaction';

/** Hash injetado: domain/ não importa node:crypto. */
export type Hash = (input: string) => string;
export type Mode = 'complete' | 'incremental';

export interface IdentifiedTransaction {
  tx: NormalizedTransaction;
  baseKey: string;
  occurrence: number;
  identityKey: string;
  isNew: boolean;
}

/** NFD, sem marcas combinantes, minúsculas, espaços colapsados. A pontuação fica. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\p{White_Space}+/gu, ' ')
    .trim();
}

/** Texto canônico antes do hash. Ficam fora: status, type, postedAt, externalId, merchantName. */
export function baseKeyInput(t: NormalizedTransaction): string {
  return JSON.stringify([
    t.source,
    t.accountRef,
    t.date,
    t.time ?? null,
    t.amount,
    normalizeText(t.description),
  ]);
}

export function baseKey(t: NormalizedTransaction, hash: Hash): string {
  return hash(baseKeyInput(t));
}

export function identityKey(bk: string, occurrence: number, hash: Hash): string {
  if (!Number.isSafeInteger(occurrence) || occurrence < 1) {
    throw new Error('identityKey: occurrence deve ser inteiro seguro >= 1');
  }
  return hash(JSON.stringify([bk, occurrence]));
}

/**
 * Atribui ocorrência e identidade a cada transação do lote, na mesma ordem.
 * complete: o lote traz o período inteiro; é novo só o que passa do já gravado.
 * incremental: o lote traz só o que a fonte considera novo; continua a contagem.
 * Entradas inválidas são erro de programação.
 */
export function assignIdentities(
  batch: readonly NormalizedTransaction[],
  existingCounts: ReadonlyMap<string, number>,
  mode: Mode,
  hash: Hash,
): IdentifiedTransaction[] {
  if (mode !== 'complete' && mode !== 'incremental') {
    throw new Error('assignIdentities: mode inválido');
  }
  for (const count of existingCounts.values()) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('assignIdentities: existingCounts deve conter inteiros >= 0');
    }
  }

  const seen = new Map<string, number>();
  return batch.map((tx) => {
    const bk = baseKey(tx, hash);
    const existing = existingCounts.get(bk) ?? 0;
    const inBatch = (seen.get(bk) ?? 0) + 1;
    seen.set(bk, inBatch);
    const occurrence = mode === 'complete' ? inBatch : existing + inBatch;
    if (!Number.isSafeInteger(occurrence)) {
      throw new Error('assignIdentities: ocorrência fora do intervalo de inteiros seguros');
    }
    return {
      tx,
      baseKey: bk,
      occurrence,
      identityKey: identityKey(bk, occurrence, hash),
      isNew: occurrence > existing,
    };
  });
}
