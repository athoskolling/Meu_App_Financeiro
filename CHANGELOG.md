# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

### Adicionado

- E0, fundação (ficará na v0.0): toolchain com pnpm 12.11.2, Node 24, TypeScript `strict` com `noUncheckedIndexedAccess`, Vitest, ESLint (configuração flat) e Prettier.
- Isolamento de `domain/`: regra de lint que barra importação de I/O (`fs`, `fetch`, Drizzle, Next, `node:*`), com teste permanente em `tests/lint/`.
- CI no GitHub Actions: typecheck, lint, testes, verificação de formatação e gitleaks em todo PR para `main`.
- `.gitignore` que barra segredos, extratos, dumps e imagens; `.env.example` com os nomes das variáveis, sem valores.
- Estrutura de `docs/` (spec, decisões, gates e cartões de tarefa) e `CLAUDE.md`.
