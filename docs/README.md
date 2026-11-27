# Documentação: onde está cada coisa

| Pasta ou arquivo | O que tem | Quem escreve |
| --- | --- | --- |
| `../ROADMAP.md` | o plano: estágios, tarefas, dependências e datas | `cto` |
| `spec/Meu_financeiro.md` | a especificação completa do app | dono e `cto` |
| `spec/Fase0_roteiro.md` | o roteiro do núcleo de domínio (contratos e casos) | `cto` |
| `equipes/AGENTES.md` | como as equipes de agentes trabalham | `cto` |
| `equipes/GUIA_ATE_V1.md` | o passo a passo até a v1.0 com as duas equipes | `cto` |
| `decisoes/` | as ADRs (decisões registradas) e o índice `README.md` | `cto`, com aprovação do dono |
| `tasks/` | os cartões de tarefa, por estágio (`E0/`, `E1/`…), e o modelo `_TEMPLATE.md` | `cto` (cartão), agentes (relatórios) |
| `gates/` | o checklist de cada gate (`E0.md` a `E6.md`) | `cto` preenche, o dono fecha |
| `design/` | o design de referência das telas (`*.dc.html`) | dono |
| `historico/` | registros que já terminaram e servem só de consulta: a auditoria da zen-mayer (`auditoria-zen-mayer/`) e a delegação ao Gemini (`delegacao/`) | ninguém mais edita |

Os arquivos de `historico/` foram mantidos como foram escritos, então citam os caminhos antigos (`docs/auditoria/…`, `docs/Meu_financeiro.md`, `docs/Fase0_roteiro.md`).

## Raiz do repositório

Na raiz ficam só os arquivos que precisam estar lá:

- as configurações que as ferramentas procuram na raiz: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `instrumentation.ts`, `eslint.config.mjs`, `vitest.config.ts`, `postcss.config.mjs`, `docker-compose.yml` e os arquivos com ponto (`.editorconfig`, `.nvmrc`, `.prettierrc.json`…);
- as instruções que cada equipe lê sozinha: `CLAUDE.md` e `GEMINI.md`;
- o `ROADMAP.md` e o `CHANGELOG.md`.

| Pasta de código | Equipe (ADR-0023) |
| --- | --- |
| `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/` | Claude |
| `app/` (fora de `app/api/`), `components/`, estilos, `public/` | Gemini |
| `tests/` | a equipe da tarefa (o QA escreve em `tests/qa/`) |
| `tools/ci/` | a verificação de limites do CI (ADR-0025) |
| `.claude/` e `.agents/` | os agentes de cada equipe (só o `cto` ou o dono mudam) |
