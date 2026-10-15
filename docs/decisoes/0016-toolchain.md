# 0016 — Toolchain do E0

- **Status:** aceita (dono, 14/10/2026); emenda 1 aceita (dono, 14/10/2026)
- **Estágio:** E0

## Contexto

O E0 precisa fixar versões e ferramentas antes da T0.1, para que agentes, CI e a máquina do dono rodem igual. O roadmap pedia que a regra de isolamento de `domain/` fosse provada "com um arquivo de exemplo que falha; removido depois".

## Decisão

1. **Node 24 LTS** no CI e em `.nvmrc`; `engines.node` = `>=24`. A máquina do dono roda Node 26, que é compatível. Rever quando o Node 26 virar LTS.
2. **pnpm 12.11.2**, fixado em `packageManager` no `package.json` (a versão instalada na máquina do dono).
3. **ESLint com configuração flat** (versão: ver emenda 1) (`eslint.config.mjs`) + `typescript-eslint`; **Prettier** à parte (sem regras de estilo no ESLint).
4. **TypeScript** `strict` + `noUncheckedIndexedAccess`; **Vitest** para testes.
5. **Fim de linha LF** no repositório (`.gitattributes`), porque a máquina do dono usa `core.autocrlf=true`.
6. **Prova do isolamento de `domain/` por teste permanente**: um teste em `tests/lint/` chama a API do ESLint com `filePath` dentro de `domain/` e confirma que cada importação proibida gera erro e que uma importação permitida não gera. Substitui o arquivo de exemplo apagado: a prova fica no CI para sempre e nenhum arquivo quebrado entra no repositório.

## Consequências

- Atualizar Node ou pnpm é mudança de dependência: nova ADR ou emenda a esta.
- O item do gate E0 "provado com um arquivo de exemplo que falha; removido depois" passa a ser cumprido pelo teste da T0.2.

## Emenda 1 — versões efetivas da T0.1 (14/10/2026)

Na T0.1, duas versões saíram diferentes do texto original. O dono aceitou as duas:

- **ESLint 10** (com `@eslint/js` 10) em vez de 9. É a versão estável atual, funciona com `typescript-eslint` 8.71 e o lint com type-check roda em cerca de 5 s.
- **TypeScript fixado em `~6.0`** (6.0.3), não 7. O `typescript-eslint` 8.71 declara peer `typescript <6.1.0` e quebra no TS 7 ("does not support TS 7.0"). O `~` impede que o TS suba sozinho para uma versão sem suporte.
- **Prettier só no código:** `.prettierignore` também ignora `docs/`, `.claude/`, `CLAUDE.md` e `ROADMAP.md`, para que a formatação automática não reescreva a spec e os documentos.

**Rever** quando o `typescript-eslint` suportar TS 7: subir TypeScript, typescript-eslint e lockfile juntos, num cartão próprio, com `pnpm typecheck && pnpm lint && pnpm test` verdes.
