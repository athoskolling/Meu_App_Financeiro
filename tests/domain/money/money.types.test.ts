import { describe, it } from 'vitest';
import type { Cents } from '../../../domain/money';

describe('tipo Cents', () => {
  it('um number comum não é aceito como Cents (verificado pelo typecheck)', () => {
    // @ts-expect-error number puro não é Cents; só cents() cria Cents
    const x: Cents = 5;
    void x;
  });
});
