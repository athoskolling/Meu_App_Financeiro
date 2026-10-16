import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url)).replaceAll('\\', '/');
const CONFIG = `${RAIZ}domain/tsconfig.json`;
const PROBE = `${RAIZ}domain/__probe__.ts`;

const norm = (nome: string) => nome.replaceAll('\\', '/');

/** Erros de tipo de um arquivo em memória em domain/__probe__.ts, usando domain/tsconfig.json (ADR-0019). */
function erros(codigo: string): string[] {
  const lido = ts.readConfigFile(CONFIG, (f) => ts.sys.readFile(f));
  expect(lido.error).toBeUndefined();
  const cfg = ts.parseJsonConfigFileContent(lido.config, ts.sys, dirname(CONFIG));
  const host = ts.createCompilerHost(cfg.options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (nome, lang, ...resto) =>
    norm(nome) === PROBE ? ts.createSourceFile(nome, codigo, lang) : original(nome, lang, ...resto);
  const existe = host.fileExists.bind(host);
  host.fileExists = (nome) => norm(nome) === PROBE || existe(nome);
  const programa = ts.createProgram([PROBE], cfg.options, host);
  return ts
    .getPreEmitDiagnostics(programa, programa.getSourceFile(PROBE))
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

describe('domain/tsconfig.json barra globais de navegador e do Node', () => {
  it.each([
    ['document', 'export const d = document.title;'],
    ['localStorage', "export const s = localStorage.getItem('x');"],
    ['Buffer', "export const b = Buffer.from('x');"],
  ])('%s é erro de tipo', (_nome, codigo) => {
    expect(erros(codigo).length).toBeGreaterThan(0);
  });

  it('ES2023 continua disponível', () => {
    expect(erros('export const n: number = [1, 2].at(0) ?? 0;')).toEqual([]);
  });
});
