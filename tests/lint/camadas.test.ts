import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

// ADR-0029: a regra de dependência das camadas em src/ é checada pelo lint.
// Mesmo método de domain-isolation.test.ts: arquivo-sonda em memória, sem type-check.
const eslint = new ESLint({
  cwd: fileURLToPath(new URL('../../', import.meta.url)),
  overrideConfig: tseslint.configs.disableTypeChecked,
});

const MENSAGEM_APPLICATION =
  'src/application/ só depende de src/domain/: infraestrutura, telas e frameworks entram por parâmetro (ADR-0029).';
const MENSAGEM_COMPONENTS =
  'src/components/ só recebe ViewModel pronto: não importa domain/, application/ nem infrastructure/ (ADR-0028 e ADR-0029).';

async function mensagens(codigo: string, filePath: string): Promise<string[]> {
  const [resultado] = await eslint.lintText(codigo, { filePath });
  const msgs = resultado?.messages ?? [];
  expect(msgs.filter((m) => m.fatal)).toEqual([]);
  return msgs.map((m) => m.message);
}

/** O ESLint põe um prefixo antes da mensagem ("... import is restricted ..."). */
const cita = (msgs: string[], mensagem: string) => msgs.some((m) => m.includes(mensagem));

const APP = 'src/application/lancamentos/__probe__.ts';
const COMP = 'src/components/painel/__probe__.tsx';

describe('src/application/ só depende de domain/', () => {
  it.each([
    ['infraestrutura', 'import { env } from "../../infrastructure/env";'],
    ['infraestrutura (pasta)', 'import * as infra from "../../infrastructure";'],
    ['rota', 'import x from "../../app/api/manual/route";'],
    ['tela', 'import { ResumoMes } from "../../components/painel/ResumoMes";'],
    ['next', 'import { headers } from "next/headers";'],
    ['react', 'import { useState } from "react";'],
    ['drizzle', 'import { eq } from "drizzle-orm";'],
    ['supabase', 'import { createClient } from "@supabase/supabase-js";'],
  ])('barra %s', async (_nome, codigo) => {
    expect(cita(await mensagens(codigo, APP), MENSAGEM_APPLICATION)).toBe(true);
  });

  it.each([
    ['domínio', 'import type { Cents } from "../../domain/money";'],
    ['outro caso de uso', 'import { x } from "../sincronizacao/x";'],
  ])('permite %s', async (_nome, codigo) => {
    expect(cita(await mensagens(codigo, APP), MENSAGEM_APPLICATION)).toBe(false);
  });
});

describe('src/components/ só recebe ViewModel', () => {
  it.each([
    ['domínio', 'import { formatBRL } from "../../domain/money";'],
    ['caso de uso', 'import { x } from "../../application/x";'],
    ['infraestrutura', 'import { env } from "../../infrastructure/env";'],
    ['banco', 'import { eq } from "drizzle-orm";'],
    ['supabase', 'import { createClient } from "@supabase/supabase-js";'],
  ])('barra %s', async (_nome, codigo) => {
    expect(cita(await mensagens(codigo, COMP), MENSAGEM_COMPONENTS)).toBe(true);
  });

  it.each([
    ['contrato de ViewModel', 'import type { ResumoPainelVM } from "../contratos/ui";'],
    ['react', 'import { useState } from "react";'],
    ['next/link', 'import Link from "next/link";'],
  ])('permite %s', async (_nome, codigo) => {
    expect(cita(await mensagens(codigo, COMP), MENSAGEM_COMPONENTS)).toBe(false);
  });
});

describe('controle: fora das camadas a regra não vale', () => {
  it('src/app/ (composição) pode importar infraestrutura e telas', async () => {
    const msgs = await mensagens(
      'import { env } from "../infrastructure/env";\nimport { Logo } from "../components/Logo";',
      'src/app/__probe__.tsx',
    );
    expect(cita(msgs, MENSAGEM_APPLICATION)).toBe(false);
    expect(cita(msgs, MENSAGEM_COMPONENTS)).toBe(false);
  });
});
