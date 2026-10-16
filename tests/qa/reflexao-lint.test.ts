// QA do T1.0a: variações de reflexão e de import.meta no lint de domain/.
// Usa o mesmo método de tests/lint/domain-isolation.test.ts (lintText + overrideConfig),
// sem dependências novas. Dados sintéticos.
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({
  cwd: fileURLToPath(new URL('../../', import.meta.url)),
  overrideConfig: tseslint.configs.disableTypeChecked,
});

const MENSAGEM_DOMAIN = 'domain/ é TypeScript puro: sem I/O, framework ou banco (ver CLAUDE.md).';
const MENSAGEM_REFLEXAO =
  "domain/ não usa reflexão (.constructor, new.target). Em classe de erro, use nome literal: this.name = 'MeuErro' (ADR-0017).";

const P = 'domain/__probe__.ts';

async function mensagens(codigo: string, filePath: string) {
  const [resultado] = await eslint.lintText(codigo, { filePath });
  return resultado?.messages ?? [];
}

/** Classifica o resultado: 'REFLEXAO', 'DOMAIN', 'NENHUMA' ou 'FATAL'. */
async function classificar(codigo: string, filePath: string): Promise<string> {
  const msgs = await mensagens(codigo, filePath);
  if (msgs.some((m) => m.fatal)) return 'FATAL';
  const ref = msgs.some((m) => m.message === MENSAGEM_REFLEXAO);
  const dom = msgs.some((m) => m.message === MENSAGEM_DOMAIN);
  if (ref && dom) return 'REFLEXAO+DOMAIN';
  if (ref) return 'REFLEXAO';
  if (dom) return 'DOMAIN';
  return 'NENHUMA';
}

// [rótulo, código, filePath, classificação esperada]
const casos: [string, string, string, string][] = [
  // Casos do cartão
  [
    'this.constructor.name',
    'export class E extends Error { constructor() { super(); this.name = this.constructor.name; } }',
    P,
    'REFLEXAO',
  ],
  ['(() => 0).constructor', 'export const k = (() => 0).constructor;', P, 'REFLEXAO'],
  ['new.target', 'export function F() { return new.target; }', P, 'REFLEXAO'],
  ['import.meta.url', 'export const u = import.meta.url;', P, 'DOMAIN'],
  [
    'classe de erro com nome literal',
    "export class E extends Error { constructor() { super(); this.name = 'E'; } }",
    P,
    'NENHUMA',
  ],
  // Variações de optional chaining e chamadas
  ['x?.constructor', 'export const c = (x as unknown as object)?.constructor;', P, 'REFLEXAO'],
  [
    'x?.constructor?.name',
    'export const c = (x as unknown as object)?.constructor?.name;',
    P,
    'REFLEXAO',
  ],
  ['x?.constructor()', 'export const c = (x as unknown as object)?.constructor();', P, 'REFLEXAO'],
  ['x.constructor()', 'export const c = (x as unknown as object).constructor();', P, 'REFLEXAO'],
  [
    'new (x.constructor)()',
    'export const c = new ((x as unknown as object).constructor)();',
    P,
    'REFLEXAO',
  ],
  // new.target em lugares diferentes
  [
    'new.target dentro de arrow em função',
    'export function F() { const g = () => new.target; return g; }',
    P,
    'REFLEXAO',
  ],
  ['new.target ?? 1', 'export function F() { return new.target ?? 1; }', P, 'REFLEXAO'],
  [
    'new.target no constructor de classe de erro',
    'export class E extends Error { constructor() { super(); this.name = new.target.name; } }',
    P,
    'REFLEXAO',
  ],
  // import.meta em variações: continua com a mensagem de I/O
  ['import.meta.env', 'export const e = import.meta.env;', P, 'DOMAIN'],
  ['import.meta?.url', 'export const e = import.meta?.url;', P, 'DOMAIN'],
  ['typeof import.meta', 'export const t = typeof import.meta;', P, 'DOMAIN'],
  // this.constructor em método estático e no topo do módulo
  [
    'this.constructor em método estático',
    'export class A { static m() { return this.constructor; } }',
    P,
    'REFLEXAO',
  ],
  [
    'this.constructor.name em método estático',
    'export class A { static m() { return this.constructor.name; } }',
    P,
    'REFLEXAO',
  ],
  ['this.constructor no topo do módulo', 'export const c = this.constructor;', P, 'REFLEXAO'],
  [
    'Object.getPrototypeOf(x).constructor',
    'export const c = Object.getPrototypeOf({}).constructor;',
    P,
    'REFLEXAO',
  ],
  // Arquivos e subpastas de domain/: a regra vale para todos
  [
    '.constructor em domain/*.test.ts',
    'export const c = (() => 0).constructor;',
    'domain/__probe__.test.ts',
    'REFLEXAO',
  ],
  [
    '.constructor em domain/x.js',
    'export const c = (() => 0).constructor;',
    'domain/x.js',
    'REFLEXAO',
  ],
  [
    'new.target em domain/x.mjs',
    'export function F() { return new.target; }',
    'domain/x.mjs',
    'REFLEXAO',
  ],
  [
    '.constructor em subpasta',
    'export const c = (() => 0).constructor;',
    'domain/a/b/c.ts',
    'REFLEXAO',
  ],
  // Não são reflexão: não devem dar erro de reflexão (falsos positivos)
  ['chave "constructor" em objeto', 'export const o = { constructor: 1 };', P, 'NENHUMA'],
  [
    'método constructor de classe',
    'export class A { constructor() { this.x = 1; } x = 0; }',
    P,
    'NENHUMA',
  ],
  ['constructor em interface TS', 'export interface I { constructor: number }', P, 'NENHUMA'],
  ['constructor em tipo literal', 'export type T = { constructor: string };', P, 'NENHUMA'],
  ['identificador constructorName', 'export const constructorName = "x";', P, 'NENHUMA'],
  // Regressões: Function continua com a mensagem de I/O
  ['new Function', 'export const g = new Function("return 1");', P, 'DOMAIN'],
  ['Function(...) sem new', 'export const f = Function("return 1");', P, 'DOMAIN'],
  ['import() dinâmico', 'export const x = await import("node:fs");', P, 'DOMAIN'],
];

describe('QA T1.0a: classificação das mensagens do lint em domain/', () => {
  it.each(casos)('%s -> %s', async (_rotulo, codigo, filePath, esperado) => {
    expect(await classificar(codigo, filePath)).toBe(esperado);
  });
});

// Propriedade: qualquer nome de variável gera reflexão; nomes que só contêm a palavra não geram.
// Gerador com semente fixa (sem dependência nova), para o resultado ser reproduzível.
function gerador(semente: number) {
  let estado = semente;
  return () => {
    estado = (estado * 1103515245 + 12345) & 0x7fffffff;
    return estado / 0x7fffffff;
  };
}

function sufixo(rnd: () => number): string {
  const letras = 'abcdefghijklmnopqrstuvwxyz';
  const tamanho = 1 + Math.floor(rnd() * 8);
  let s = '';
  for (let i = 0; i < tamanho; i++) s += letras[Math.floor(rnd() * letras.length)];
  return s;
}

describe('QA T1.0a: propriedades (semente fixa)', () => {
  it('qualquer `<nome>.constructor` em domain/ dá MENSAGEM_REFLEXAO', async () => {
    const rnd = gerador(42);
    for (let i = 0; i < 15; i++) {
      const nome = 'v' + sufixo(rnd);
      const codigo = `export const r = (${nome} as unknown as object).constructor;`;
      expect(await classificar(codigo, P), codigo).toBe('REFLEXAO');
    }
  });

  it('qualquer `new.target` dentro de função em domain/ dá MENSAGEM_REFLEXAO', async () => {
    const rnd = gerador(7);
    for (let i = 0; i < 10; i++) {
      const nome = 'f' + sufixo(rnd);
      const codigo = `export function ${nome}() { return new.target; }`;
      expect(await classificar(codigo, P), codigo).toBe('REFLEXAO');
    }
  });

  it('propriedade chamada constructor<sufixo> (sem ponto) não dá reflexão', async () => {
    const rnd = gerador(99);
    for (let i = 0; i < 10; i++) {
      const s = sufixo(rnd);
      const codigo = `export const o = { constructor${s}: 1, c: { constructor: 2 } };`;
      expect(await classificar(codigo, P), codigo).toBe('NENHUMA');
    }
  });
});

describe('QA T1.0a: execuções simultâneas dão o mesmo resultado', () => {
  it('lintText em paralelo sobre o mesmo código é determinístico', async () => {
    const sequencial: string[] = [];
    for (const [, codigo, filePath] of casos) sequencial.push(await classificar(codigo, filePath));
    const paralelo = await Promise.all(
      casos.map(([, codigo, filePath]) => classificar(codigo, filePath)),
    );
    expect(paralelo).toEqual(sequencial);
    expect(paralelo.length).toBe(casos.length);
  });
});
