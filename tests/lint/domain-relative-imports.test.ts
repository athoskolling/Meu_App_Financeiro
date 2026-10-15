import { readdirSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

/** Especificadores de import, export-from e `import x = require()` de um código TypeScript. */
function especificadores(codigo: string, arquivo: string): string[] {
  const fonte = ts.createSourceFile(arquivo, codigo, ts.ScriptTarget.Latest, true);
  const lista: string[] = [];
  const visitar = (no: ts.Node): void => {
    if (
      (ts.isImportDeclaration(no) || ts.isExportDeclaration(no)) &&
      no.moduleSpecifier &&
      ts.isStringLiteral(no.moduleSpecifier)
    ) {
      lista.push(no.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(no) &&
      ts.isExternalModuleReference(no.moduleReference) &&
      ts.isStringLiteral(no.moduleReference.expression)
    ) {
      lista.push(no.moduleReference.expression.text);
    } else if (
      ts.isImportTypeNode(no) &&
      ts.isLiteralTypeNode(no.argument) &&
      ts.isStringLiteral(no.argument.literal)
    ) {
      lista.push(no.argument.literal.text);
    } else if (
      ts.isCallExpression(no) &&
      no.expression.kind === ts.SyntaxKind.ImportKeyword &&
      no.arguments[0] &&
      ts.isStringLiteralLike(no.arguments[0])
    ) {
      lista.push(no.arguments[0].text);
    }
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
  return lista;
}

/**
 * Devolve os especificadores relativos de `codigo` que resolvem para fora de `domain/`.
 * `arquivo` é o caminho do arquivo a partir da raiz do repositório (ex.: `domain/sub/a.ts`).
 */
export function relativosForaDoDomain(codigo: string, arquivo: string): string[] {
  const pasta = posix.dirname(arquivo);
  return especificadores(codigo, arquivo).filter((spec) => {
    if (!/^\.\.?(\/|$)/.test(spec)) return false; // não relativo: a lista de permitidos do lint cuida
    const destino = posix.normalize(posix.join(pasta, spec));
    return destino !== 'domain' && !destino.startsWith('domain/');
  });
}

function arquivosDoDomain(): string[] {
  return readdirSync(`${RAIZ}domain`, { recursive: true, encoding: 'utf8' })
    .map((p) => p.replaceAll('\\', '/'))
    .filter((p) => /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(p))
    .map((p) => `domain/${p}`);
}

describe('imports relativos de domain/ não saem de domain/', () => {
  const casos: [string, string, string, boolean][] = [
    ['domain/a.ts', 'import { b } from "./b";', './b', true],
    ['domain/sub/a.ts', 'import { b } from "../b";', '../b', true],
    ['domain/sub/a.ts', 'import { io } from "../../lib/io";', '../../lib/io', false],
    ['domain/a.ts', 'import { io } from "../lib/io";', '../lib/io', false],
    ['domain/a.ts', 'export * from "../tests/x";', '../tests/x', false],
    ['domain/a.ts', 'import x = require("../lib/x");', '../lib/x', false],
    ['domain/a.ts', 'export type K = typeof import("../lib/k");', '../lib/k', false],
    ['domain/a.ts', 'export const m = () => import("../lib/m");', '../lib/m', false],
    ['domain/a.ts', 'export type L = import("./l").L;', './l', true],
    ['domain/a.mjs', 'export * from "../lib/io";', '../lib/io', false],
    ['domain/sub/a.ts', 'export { b } from "..";', '..', true],
    ['domain/a.ts', 'import { x } from "../domain-outro/x";', '../domain-outro/x', false],
  ];

  it.each(casos)('%s com %s', (arquivo, codigo, spec, ok) => {
    const fora = relativosForaDoDomain(codigo, arquivo);
    expect(fora).toEqual(ok ? [] : [spec]);
  });

  it('domain/ real não tem import relativo para fora', () => {
    const fora = arquivosDoDomain().flatMap((arquivo) =>
      relativosForaDoDomain(readFileSync(`${RAIZ}${arquivo}`, 'utf8'), arquivo).map(
        (spec) => `${arquivo}: ${spec}`,
      ),
    );
    expect(fora).toEqual([]);
  });
});
