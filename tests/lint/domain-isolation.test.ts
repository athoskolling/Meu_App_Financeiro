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
  ['subpasta domain/a/b/c.ts', FS, 'domain/a/b/c.ts'],
  ['extensao .mts', FS, 'domain/__probe__.mts'],
  ['extensao .tsx', FS, 'domain/__probe__.tsx'],
];

const permitidos: [string, string, string][] = [
  ['import type relativo', 'import type { Foo } from "./foo";', P],
  ['import relativo', 'import { z } from "./local";', P],
  ['codigo puro', 'export const soma = (a: number, b: number) => a + b;', P],
];

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

  it('controle: fora de domain/ a regra nao vale', async () => {
    const msgs = await mensagens(FS, 'lib/__probe__.ts');
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM))).toEqual([]);
  });
});
