# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

## [0.0] - 2026-10-15

E0, fundação.

### Adicionado

- Toolchain: pnpm 12.11.2, Node 24, TypeScript ~6.0 `strict` com `noUncheckedIndexedAccess`, Vitest 5, ESLint 10 (configuração flat, com type-check) e Prettier 3. O `pnpm lint` falha com qualquer aviso (`--max-warnings=0`).
- Isolamento de `domain/` (ADR-0017):
  - só arquivos `.ts`, e só imports do próprio `domain/`;
  - comentários `eslint-disable` não valem;
  - barrados os módulos do Node, banco, Next/React, `fetch`, `process`, `eval`, `Function`, `import()` e `import.meta`;
  - testes permanentes em `tests/lint/`.
- CI no GitHub Actions: typecheck, lint, testes, formatação e gitleaks (histórico inteiro, binário com checksum) em todo PR e push na `main`. As actions estão fixadas por SHA.
- `.gitignore` que barra segredos, extratos, dumps, imagens e saídas temporárias, sem diferenciar maiúsculas; `.env.example` com os nomes das 8 variáveis, sem valores.
- Estrutura de `docs/` (spec, decisões, gates e cartões de tarefa) e `CLAUDE.md`.
- `main` protegida: PR obrigatório, checks `check` e `gitleaks` obrigatórios e branch atualizada; *secret scanning* e *push protection* ligados.
