# 0017: Isolamento de `domain/` por lista de permitidos

- **Status:** aceita (CTO, 15/10/2026, a partir do parecer do revisor na T0.4r). O dono aprova junto com o gate E0.
- **Estágio:** E0
- **Substitui:** a forma de lista de proibidos da T0.2 (o objetivo do item 6 da ADR-0016 continua o mesmo)

## Contexto

A T0.2 isolou `domain/` com uma lista de **proibidos** (módulos nativos, Drizzle, `pg`, Next, React, globais de I/O). Na T0.4r o revisor mostrou, em lint real, quatro furos:

1. `// eslint-disable-next-line` (ou `/* eslint-disable */`) desliga o isolamento inteiro. Quem escreve código são agentes, e "fazer o lint passar" com um comentário é exatamente a falha que queremos impedir.
2. A lista de proibidos nunca fecha. `pg-pool`, `undici`, `bun:sqlite`, `https://esm.sh/x` e o alias `@/lib/...` passam.
3. Um import relativo pode sair de `domain/` (`../lib/io`) e trazer I/O por re-export.
4. `.js`, `.mjs` e `.cjs` quebram o `pnpm lint` do repositório inteiro (erro do project service) e não recebem o isolamento.

## Decisão

1. **Lista de permitidos em `domain/`:** só imports relativos (`./`, `../`, `.`, `..`). A lista de pacotes de terceiros permitidos começa **vazia**: nenhum pacote entra em `domain/` sem uma ADR que o acrescente. Arquivos de teste dentro de `domain/` (`*.test.ts`) podem importar `vitest`. A lista de proibidos atual pode continuar no bloco só para dar mensagens melhores nos casos conhecidos.
2. **Comentários de desativação não valem em `domain/`:** `linterOptions.noInlineConfig: true` e `reportUnusedDisableDirectives: 'error'` no bloco de `domain/**`.
3. **Imports relativos ficam dentro de `domain/`:** um teste em `tests/lint/` percorre os arquivos de `domain/` com a API do TypeScript (já é dependência) e falha se algum especificador relativo resolver para fora de `domain/`.
4. **JS:** um bloco aplica `disableTypeChecked` a `**/*.{js,mjs,cjs}`, para o lint não quebrar quando entrar o primeiro arquivo de config em JS (E2). O bloco de `domain/` também cobre `.js`, `.mjs` e `.cjs`.
5. **Os globais proibidos continuam** (`fetch`, `process`, `globalThis`, `eval`, `new Function`, `import()` etc.).

## Consequências

- Acrescentar um pacote a `domain/` (ex.: uma lib pura de datas) exige ADR e caso de teste.
- Mudanças em `.github/**`, `eslint.config.mjs`, `tests/lint/**`, `.gitignore` ou nos scripts do `package.json` passam a exigir o `revisor`, porque são as travas do projeto e um PR pode editá-las.
- Não determinismo (`Date.now()`, `new Date()` sem argumento, `Math.random`) não é I/O e não é barrado pelo lint. A regra fica nos casos de teste do E1: funções de domínio recebem a data de referência por parâmetro.
- Fica como risco registrado: globais de outros ambientes (`Deno`, `Bun`, `navigator`, `document`, `localStorage`).
