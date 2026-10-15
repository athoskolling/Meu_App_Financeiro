# 0017: Isolamento de `domain/` por lista de permitidos

- **Status:** aceita (CTO, 15/10/2026, a partir do parecer do revisor na T0.4r); emendas 1 e 2 (15/10/2026). O dono aprova junto com o gate E0.
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

## Emenda 1: `domain/` aceita só `.ts` (15/10/2026)

Na revisão da T0.4c, o revisor mostrou que `domain/y.mjs` com `export * from "../lib/io.mjs"` passava no lint e nos testes, porque o teste de import relativo olhava só arquivos TypeScript. Também mostrou que `domain/*.jsx` não recebia nenhuma regra.

**Decisão:** `domain/` contém só arquivos `.ts` (inclusive `.d.ts` e `.test.ts`), além de `.gitkeep`. Um teste em `tests/lint/` falha se aparecer qualquer outro arquivo. É a forma literal do que o `CLAUDE.md` já dizia ("`domain/` é TypeScript puro"). Como defesa em profundidade, o lint e o teste de import relativo continuam cobrindo também `js`, `jsx`, `mjs`, `cjs`, `tsx`, `mts` e `cts`.

**Também barrados em `domain/`:**
- os globais `module` e `exports`;
- `Function(...)` sem `new`;
- `(...).constructor(...)`;
- `import.meta` (o seletor `MetaProperty` também barra `new.target`);
- `import("...")` em posição de tipo. A mensagem é própria: use `import type`.

**Regra de manutenção:** os blocos de `domain/` ficam por último no `eslint.config.mjs` (antes do `prettier`), para nenhum bloco posterior sobrepor as regras.

**Riscos residuais aceitos:** `import fs = globalThis.process` (o `globalThis` só é barrado em posição de expressão) e outras formas exóticas que o lint não pega. A revisão de diff e a proibição de pacotes de fora cobrem o caso real.

## Emenda 2: limite do lint (15/10/2026)

Na reverificação do PR #7, o QA mostrou que `Function.call(null, "return process.getBuiltinModule('fs')")()` chega no `fs` sem nenhum `import`. O motivo é que o código fica dentro de um texto, e texto o lint não analisa. Existem infinitas variações desse truque.

**Decisão (aprovada pelo dono):**
- O lint barra também o global `Function` e o acesso a `.constructor` por ponto (`x.constructor`, `x?.constructor`) em `domain/`. Isso fecha **as formas comuns** (T0.4d), mas não todas: `x["constructor"]`, `Reflect.get(x, "constructor")`, desestruturação `{ constructor: k }` com cast e `setTimeout("texto")` continuam passando e ficam com a revisão de diff.
- Efeito aceito: `this.constructor.name` e `new.target` também ficam barrados. Uma classe de erro de domínio usa nome literal (`this.name = "MeuErro"`).
- Alguns seletores ficaram redundantes de propósito (`Function(...)`, `new Function(...)` e `.constructor(...)` já são cobertos pelo global e pelo `MemberExpression`). É defesa em profundidade, não um erro.
- **O lint é uma trava contra acidente, não contra sabotagem.** Código que esconde I/O de propósito (dentro de texto, por reflexão ou de forma ofuscada) é responsabilidade da revisão de diff. Por isso o `revisor` é obrigatório em toda tarefa que toca `domain/`.
- O revisor rejeita qualquer texto passado para execução dinâmica em `domain/`.
