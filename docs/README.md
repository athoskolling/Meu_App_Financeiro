# Documentação — onde está cada coisa

| Pasta ou arquivo | O que tem | Quem escreve |
| --- | --- | --- |
| `../ROADMAP.md` | o plano: estágios, tarefas, dependências e datas | `cto` |
| `spec/Meu_financeiro.md` | a especificação completa do app | dono e `cto` |
| `spec/Fase0_roteiro.md` | o roteiro do núcleo de domínio (contratos e casos) | `cto` |
| `equipes/AGENTES.md` | como as equipes de agentes trabalham | `cto` |
| `equipes/prompts.md` | **os prompts prontos, em ordem, para cada equipe** | `cto` |
| `decisoes/` | as ADRs (decisões registradas) e o índice | `cto`, com aprovação do dono |
| `tasks/` | os cartões de tarefa, por estágio (`E0/`, `E1/`, `E2/`…), e o modelo `_TEMPLATE.md` | `cto` (cartão), agentes (relatórios) |
| `gates/` | o checklist de cada gate (`E0.md` a `E6.md`) | `cto` preenche, o dono fecha |
| `design/` | o design de referência das telas | dono |
| `historico/` | o que já passou e serve de consulta: a auditoria da zen-mayer e a delegação ao Gemini | — |

Na raiz do repositório ficam só os arquivos que as ferramentas exigem lá (`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `postcss.config.mjs`, `docker-compose.yml`, `instrumentation.ts`, `next-env.d.ts`), as instruções lidas sozinhas por cada equipe (`CLAUDE.md` e `GEMINI.md`), o `ROADMAP.md` e o `CHANGELOG.md`.

| Pasta de código | Equipe (ADR-0023) |
| --- | --- |
| `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/` | Claude |
| `app/` (fora de `app/api/`), `components/`, estilos, `public/` | Gemini |
| `tests/` | a equipe da tarefa (o QA escreve em `tests/qa/`) |
| `.claude/` e `.agents/` | os agentes de cada equipe (só o `cto` ou o dono mudam) |
