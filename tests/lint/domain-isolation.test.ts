import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

// O arquivo-sonda não existe em disco, então o project service do lint real não o
// encontraria. Desligamos só o type-check (overrideConfig vem por último); o bloco
// de isolamento de domain/ em eslint.config.mjs continua sendo o testado.
const eslint = new ESLint({
  cwd: fileURLToPath(new URL('../../', import.meta.url)),
  overrideConfig: tseslint.configs.disableTypeChecked,
});

const MENSAGEM = 'domain/ é TypeScript puro: sem I/O, framework ou banco (ver CLAUDE.md).';

async function mensagens(codigo: string, filePath: string) {
  const [resultado] = await eslint.lintText(codigo, { filePath });
  return resultado?.messages ?? [];
}

const MENSAGEM_REFLEXAO =
  "domain/ não usa reflexão (.constructor, new.target). Em classe de erro, use nome literal: this.name = 'MeuErro' (ADR-0017).";

const P = 'domain/__probe__.ts';
const FS = 'import { readFileSync } from "fs";';

// [nome, código, filePath]
const barrados: [string, string, string][] = [
  ['fs', FS, P],
  ['node:fs/promises', 'import { readFile } from "node:fs/promises";', P],
  ['path', 'import path from "path";', P],
  ['drizzle-orm/postgres-js', 'import { drizzle } from "drizzle-orm/postgres-js";', P],
  ['@supabase/supabase-js', 'import { createClient } from "@supabase/supabase-js";', P],
  ['next/server', 'import { NextResponse } from "next/server";', P],
  ['fetch global', 'export const f = () => fetch("x");', P],
  ['process global', 'export const e = process.env.X;', P],
  ['import() dinamico', 'export const x = await import("node:fs");', P],
  ['buffer', 'import { Buffer } from "buffer";', P],
  ['url', 'import { URL } from "url";', P],
  ['export * from fs', 'export * from "fs";', P],
  ['export from node:fs', 'export { readFileSync } from "node:fs";', P],
  ['import = require', 'import fs = require("fs");', P],
  ['globalThis.fetch', 'export const f = () => globalThis.fetch("x");', P],
  ['pg subpath', 'import { Pool } from "pg/lib/pool";', P],
  ['postgres subpath', 'import x from "postgres/cjs";', P],
  ['eval', 'export const h = () => eval("1");', P],
  ['new Function', 'export const g = new Function("return 1");', P],
  ['subpasta domain/a/b/c.ts', FS, 'domain/a/b/c.ts'],
  ['extensao .mts', FS, 'domain/__probe__.mts'],
  ['extensao .tsx', FS, 'domain/__probe__.tsx'],
];

// ADR-0017: lista de permitidos e comentários de desativação sem efeito.
const barradosAdr17: [string, string, string][] = [
  [
    'eslint-disable-next-line',
    '// eslint-disable-next-line @typescript-eslint/no-restricted-imports\nimport "fs";',
    P,
  ],
  ['eslint-disable bloco', '/* eslint-disable */\nimport { readFileSync } from "fs";', P],
  ['pg-pool', 'import "pg-pool";', P],
  ['undici', 'import { request } from "undici";', P],
  ['bun:sqlite', 'import { Database } from "bun:sqlite";', P],
  ['url https', 'import x from "https://esm.sh/x";', P],
  ['alias @/lib/io', 'import { io } from "@/lib/io";', P],
  ['zod (lista vazia)', 'import { z } from "zod";', P],
  ['fs em .js', 'import fs from "fs";', 'domain/__probe__.js'],
  ['fs em .mjs', 'import fs from "fs";', 'domain/__probe__.mjs'],
  ['import type fs', 'export type Stat = import("fs").Stats;', P],
  ['typeof import relativo', 'export type K = typeof import("./a");', P],
  ['require em .cjs', 'const fs = require("fs");', 'domain/x.cjs'],
  ['module.require', 'export const r = module.require("fs");', P],
  ['Function() sem new', 'export const f = Function("return 1");', P],
  ['.constructor()', 'export const g = (() => 0).constructor("return 1");', P],
  ['import.meta', 'export const u = import.meta.url;', P],
  ['Function.call', 'export const a = Function.call(null, "return 1");', P],
  ['alias de Function', 'const F = Function; export const b = F("return 1");', P],
  ['Reflect.construct', 'export const c = Reflect.construct(Function, ["return 1"]);', P],
  ['(0, Function)', 'export const d = (0, Function)("return 1");', P],
  ['.constructor por alias', 'const k = (() => 0).constructor; export const e = k;', P],
  ['vitest fora de teste', 'import { describe } from "vitest";', P],
];

const permitidosAdr17: [string, string, string][] = [
  ['vitest em .test.ts', 'import { describe } from "vitest";', 'domain/__probe__.test.ts'],
  ['./a', 'import { a } from "./a";', 'domain/sub/__probe__.ts'],
  ['../b', 'import { b } from "../b";', 'domain/sub/__probe__.ts'],
  ['.', 'import { c } from ".";', 'domain/sub/__probe__.ts'],
  ['..', 'import { d } from "..";', 'domain/sub/__probe__.ts'],
];

const permitidos: [string, string, string][] = [
  ['import type relativo', 'import type { Foo } from "./foo";', P],
  ['import relativo', 'import { z } from "./local";', P],
  ['soma tipada', 'export const soma = (a: number, b: number): number => a + b;', P],
  ['codigo puro', 'export const soma = (a: number, b: number) => a + b;', P],
];

// T1.0a: reflexão tem mensagem própria; import.meta continua com a mensagem de I/O.
const reflexao: [string, string][] = [
  [
    'this.constructor.name',
    'export class E extends Error { constructor() { super(); this.name = this.constructor.name; } }',
  ],
  ['.constructor por alias', 'export const k = (() => 0).constructor;'],
  ['new.target', 'export function F() { return new.target; }'],
];

describe('mensagens de reflexão (T1.0a)', () => {
  it.each(reflexao)('reflexão usa MENSAGEM_REFLEXAO: %s', async (_nome, codigo) => {
    const msgs = await mensagens(codigo, P);
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message === MENSAGEM_REFLEXAO).length).toBeGreaterThan(0);
  });

  it('import.meta continua com MENSAGEM_DOMAIN', async () => {
    const msgs = await mensagens('export const u = import.meta.url;', P);
    expect(msgs.filter((m) => m.message === MENSAGEM).length).toBeGreaterThan(0);
    expect(msgs.filter((m) => m.message === MENSAGEM_REFLEXAO)).toEqual([]);
  });

  it('classe de erro com nome literal passa', async () => {
    const msgs = await mensagens(
      "export class E extends Error { constructor() { super(); this.name = 'E'; } }",
      P,
    );
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.ruleId?.includes('restricted'))).toEqual([]);
  });
});

describe('isolamento de domain/', () => {
  it.each(barrados)('barra em domain/: %s', async (_nome, codigo, filePath) => {
    const msgs = await mensagens(codigo, filePath);
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM)).length).toBeGreaterThan(0);
  });

  it.each(permitidos)('permite em domain/: %s', async (_nome, codigo, filePath) => {
    const msgs = await mensagens(codigo, filePath);
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM))).toEqual([]);
  });

  it.each(barradosAdr17)('ADR-0017 barra em domain/: %s', async (_nome, codigo, filePath) => {
    const msgs = await mensagens(codigo, filePath);
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(
      msgs.filter((m) => m.severity === 2 && /domain\/.*(ADR-0017|CLAUDE\.md)/.test(m.message))
        .length,
    ).toBeGreaterThan(0);
  });

  it.each(permitidosAdr17)('ADR-0017 permite em domain/: %s', async (_nome, codigo, filePath) => {
    const msgs = await mensagens(codigo, filePath);
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.ruleId?.includes('restricted'))).toEqual([]);
  });

  it('.cjs fora de domain/ não quebra o lint (module.exports)', async () => {
    const msgs = await mensagens('module.exports = {};', 'lib/__probe__.cjs');
    expect(msgs.filter((m) => m.fatal || m.severity === 2)).toEqual([]);
  });

  it('JS fora de domain/ não quebra o lint', async () => {
    const msgs = await mensagens('export const x = 1;', 'lib/__probe__.mjs');
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
  });

  it('controle: fora de domain/ a regra nao vale', async () => {
    const msgs = await mensagens(FS, 'lib/__probe__.ts');
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM))).toEqual([]);
  });
});
