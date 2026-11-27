import { readdirSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Caminhos de domain/ que não são `.ts` (ADR-0017, emenda 1). `.gitkeep` é tolerado, e o
 * caminho exato `src/domain/tsconfig.json` também (ADR-0019); qualquer outro `.json` é rejeitado.
 */
export function arquivosNaoTs(caminhos: string[]): string[] {
  return caminhos.filter(
    (c) => !c.endsWith('.ts') && !/(^|\/)\.gitkeep$/.test(c) && c !== 'src/domain/tsconfig.json',
  );
}

/** Entrada mínima: caminho e `isDirectory()` (como o Dirent de readdirSync). */
export interface EntradaDir {
  caminho: string;
  isDirectory(): boolean;
}

/** Tudo o que não é diretório (arquivo, link simbólico etc.) conta como arquivo de domain/. */
export function caminhosConsiderados(entradas: EntradaDir[]): string[] {
  return entradas.filter((e) => !e.isDirectory()).map((e) => e.caminho);
}

describe('caminhosConsiderados', () => {
  it('inclui arquivo e link simbólico; exclui diretório', () => {
    expect(
      caminhosConsiderados([
        { caminho: 'a.ts', isDirectory: () => false },
        { caminho: 'sub', isDirectory: () => true },
        { caminho: 'l.ts', isDirectory: () => false },
      ]),
    ).toEqual(['a.ts', 'l.ts']);
  });
});

describe('domain/ só aceita arquivos .ts', () => {
  it('aceita .gitkeep, .ts, .test.ts e .d.ts', () => {
    expect(
      arquivosNaoTs([
        'src/domain/.gitkeep',
        'src/domain/a.ts',
        'src/domain/sub/b.test.ts',
        'src/domain/c.d.ts',
      ]),
    ).toEqual([]);
  });

  it('aceita o caminho exato domain/tsconfig.json (ADR-0019)', () => {
    expect(arquivosNaoTs(['src/domain/tsconfig.json'])).toEqual([]);
  });

  it.each(['sub/tsconfig.json', 'x.json'])('continua rejeitando domain/%s', (nome) => {
    expect(arquivosNaoTs([`src/domain/${nome}`])).toEqual([`src/domain/${nome}`]);
  });

  it.each(['y.mjs', 'w.js', 'p.cjs', 'b.jsx', 'c.tsx', 'd.mts', 'e.json'])(
    'rejeita domain/%s',
    (nome) => {
      expect(arquivosNaoTs([`src/domain/${nome}`])).toEqual([`src/domain/${nome}`]);
    },
  );

  it('domain/ real só tem .ts', () => {
    const todos = caminhosConsiderados(
      readdirSync(`${RAIZ}src/domain`, { recursive: true, withFileTypes: true }).map((e) => ({
        caminho: relative(RAIZ, `${e.parentPath}/${e.name}`).replaceAll('\\', '/'),
        isDirectory: () => e.isDirectory(),
      })),
    );
    expect(arquivosNaoTs(todos)).toEqual([]);
  });
});
