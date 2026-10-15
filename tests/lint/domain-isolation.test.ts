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

const barrados: [string, string][] = [
  ['fs', 'import { readFileSync } from "fs";'],
  ['node:fs/promises', 'import { readFile } from "node:fs/promises";'],
  ['path', 'import path from "path";'],
  ['drizzle-orm/postgres-js', 'import { drizzle } from "drizzle-orm/postgres-js";'],
  ['@supabase/supabase-js', 'import { createClient } from "@supabase/supabase-js";'],
  ['next/server', 'import { NextResponse } from "next/server";'],
  ['fetch global', 'export const f = () => fetch("x");'],
  ['process global', 'export const e = process.env.X;'],
  ['import() dinamico', 'export const x = await import("node:fs");'],
];

const permitidos: [string, string][] = [
  ['import type relativo', 'import type { Foo } from "./foo";'],
  ['import relativo', 'import { z } from "./local";'],
];

describe('isolamento de domain/', () => {
  it.each(barrados)('barra em domain/: %s', async (_nome, codigo) => {
    const msgs = await mensagens(codigo, 'domain/__probe__.ts');
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM)).length).toBeGreaterThan(0);
  });

  it.each(permitidos)('permite em domain/: %s', async (_nome, codigo) => {
    const msgs = await mensagens(codigo, 'domain/__probe__.ts');
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM))).toEqual([]);
  });

  it('controle: fora de domain/ a regra nao vale', async () => {
    const msgs = await mensagens('import { readFileSync } from "fs";', 'lib/__probe__.ts');
    expect(msgs.filter((m) => m.fatal)).toEqual([]);
    expect(msgs.filter((m) => m.message.includes(MENSAGEM))).toEqual([]);
  });
});
