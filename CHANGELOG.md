# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

## [0.1.1] - a definir (gate E1 parte B)

### Adicionado

- `spendingForPeriod` e datas civis (`daysInMonth`, `daysBetween`, `monthPeriod`): a única resposta para "quanto gastei no período". Pagamento de fatura, caixinha e transferência casada ficam fora; estorno desconta; o que não dá para classificar vai para `unclassified` (ADR-0020).
- `detectTransfers`: pares de transferência entre contas próprias, com desempate determinístico e confiança `high`/`medium`.
- `categorize`: tipo, regra do usuário, estabelecimento conhecido, categoria da fonte, heurística e Outros, com o motivo da escolha.

## [0.1] - a definir (gate E1 parte A)

### Adicionado

- Identidade de transação (`baseKey` + ocorrência com `existingCounts`, modos `complete` e `incremental`, hash injetado): reimportar não duplica e compras idênticas legítimas continuam separadas (ADR-0018).
- Money (`Cents`, `parseBRL`, `formatBRL` sem `Intl`, `fromDb`) e `NormalizedTransaction` com `validateTransaction`.

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
- `main` protegida: PR obrigatório, checks `check` e `gitleaks` obrigatórios e branch atualizada; _secret scanning_ e _push protection_ ligados.
