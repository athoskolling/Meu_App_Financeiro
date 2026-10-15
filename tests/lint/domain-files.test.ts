import { readdirSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

/** Caminhos de domain/ que não são `.ts` (ADR-0017, emenda 1). `.gitkeep` é tolerado. */
export function arquivosNaoTs(caminhos: string[]): string[] {
  return caminhos.filter((c) => !c.endsWith('.ts') && !/(^|\/)\.gitkeep$/.test(c));
}

describe('domain/ só aceita arquivos .ts', () => {
  it('aceita .gitkeep, .ts, .test.ts e .d.ts', () => {
    expect(
      arquivosNaoTs(['domain/.gitkeep', 'domain/a.ts', 'domain/sub/b.test.ts', 'domain/c.d.ts']),
    ).toEqual([]);
  });

  it.each(['y.mjs', 'w.js', 'p.cjs', 'b.jsx', 'c.tsx', 'd.mts', 'e.json'])(
    'rejeita domain/%s',
    (nome) => {
      expect(arquivosNaoTs([`domain/${nome}`])).toEqual([`domain/${nome}`]);
    },
  );

  it('domain/ real só tem .ts', () => {
    const todos = readdirSync(`${RAIZ}domain`, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => relative(RAIZ, `${e.parentPath}/${e.name}`).replaceAll('\\', '/'));
    expect(arquivosNaoTs(todos)).toEqual([]);
  });
});
