import { describe, expect, it } from 'vitest';
import { verificarLimites } from '../../tools/ci/limites';

describe('limites das branches (ADR-0025)', () => {
  it('equipe-claude aceita a área Claude, tests/qa e o próprio cartão', () => {
    const r = verificarLimites('equipe-claude/T1.3', [
      'domain/identity/assign.ts',
      'lib/db/schema.ts',
      'app/api/manual/route.ts',
      'proxy.ts',
      'tests/domain/identity.test.ts',
      'tests/qa/identity-qa.test.ts',
      'docs/tasks/E1/T1.3.md',
    ]);
    expect(r.ok).toBe(true);
  });

  it('equipe-claude recusa tela, configuração e cartão de outra tarefa', () => {
    const r = verificarLimites('equipe-claude/T2.6', [
      'lib/manual.ts',
      'app/page.tsx',
      'package.json',
      'docs/tasks/E2/T2.7.md',
      '.github/workflows/ci.yml',
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.foraDaArea).toEqual([
        'app/page.tsx',
        'package.json',
        'docs/tasks/E2/T2.7.md',
        '.github/workflows/ci.yml',
      ]);
  });

  it('equipe-gemini aceita áreas Gemini e Claude (ADR-0026), mas recusa configs, deps e outros cartões', () => {
    expect(
      verificarLimites('equipe-gemini/T2.10a', ['README.md', 'docs/tasks/E2/T2.10a.md']).ok,
    ).toBe(true);
    expect(
      verificarLimites('equipe-gemini/T2.5', [
        'app/layout.tsx',
        'app/entrar/page.tsx',
        'components/Nav.tsx',
        'tests/ui/nav.test.ts',
        'tests/qa/t2.5-qa.test.tsx',
        'docs/tasks/E2/T2.5.md',
      ]).ok,
    ).toBe(true);
    expect(
      verificarLimites('equipe-gemini/T1.3', [
        'domain/transactions/identity.ts',
        'lib/db/schema.ts',
        'app/api/auth/route.ts',
        'tests/domain/identity.test.ts',
        'tests/qa/identity-qa.test.ts',
        'docs/tasks/E1/T1.3.md',
      ]).ok,
    ).toBe(true);
    const r = verificarLimites('equipe-gemini/T1.3', [
      'domain/transactions/identity.ts',
      'package.json',
      'tsconfig.json',
      '.github/workflows/ci.yml',
      'docs/decisoes/0026-operacao-unificada-gemini.md',
      'docs/tasks/E2/T2.5.md',
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.foraDaArea).toEqual([
        'package.json',
        'tsconfig.json',
        '.github/workflows/ci.yml',
        'docs/decisoes/0026-operacao-unificada-gemini.md',
        'docs/tasks/E2/T2.5.md',
      ]);
  });

  it('branch de processo (cto/, claude/) mexe em docs e configs, nunca em código', () => {
    expect(
      verificarLimites('cto/cartao-t2.5', [
        'docs/tasks/E2/T2.5.md',
        'CLAUDE.md',
        '.github/workflows/limites.yml',
        'tools/ci/limites.ts',
        'tests/ci/limites.test.ts',
      ]).ok,
    ).toBe(true);
    const r = verificarLimites('claude/sessao-x', ['docs/GUIA_ATE_V1.md', 'lib/env.ts']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.foraDaArea).toEqual(['lib/env.ts']);
  });

  it('recusa branch fora do padrão e id de tarefa inválido', () => {
    expect(verificarLimites('feature/x', ['README.md']).ok).toBe(false);
    expect(verificarLimites('equipe-claude/tarefa', ['lib/a.ts']).ok).toBe(false);
    expect(verificarLimites('main', []).ok).toBe(false);
  });

  it('aceita os formatos de id do ROADMAP', () => {
    for (const id of ['T1.3', 'T1b.2', 'T2.10a', 'T1.4r', 'T0.4c']) {
      expect(verificarLimites(`equipe-claude/${id}`, ['lib/a.ts']).ok).toBe(true);
    }
  });
});
