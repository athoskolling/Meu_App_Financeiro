# 0029 — Código em `src/`, separado em camadas (clean architecture)

- **Status:** aceita pelo dono em 27/11/2026 (escolheu "src/ em camadas, com ADR e 2 PRs")
- **Atualiza:** ADR-0023 (nomes das pastas de cada equipe), ADR-0025 (nova branch `estrutura/{slug}`) e ADR-0017 (o isolamento de `domain/` passa a valer em `src/domain/`)
- **Verificação automática:** job `limites` (`tools/ci/limites.ts`) e lint (`eslint.config.mjs`)

## Contexto

O código estava espalhado na raiz, ao lado dos arquivos de configuração: `domain/`, `lib/`, `app/`, `components/` e `instrumentation.ts`. As camadas já existiam na prática (`domain/` era puro e isolado pelo lint; `lib/` era infraestrutura; `app/` e `components/` eram a interface), mas os nomes não diziam isso, e `lib/` misturava o que viria a ser banco, auth, Pluggy, log e variáveis de ambiente.

O dono pediu o projeto organizado em pastas com nomes ligados ao conteúdo, seguindo a clean architecture.

O que **não** pode sair da raiz, porque cada ferramenta procura o arquivo lá: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts` (gerado pelo Next), `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `docker-compose.yml`, os arquivos com ponto, `CLAUDE.md` e `GEMINI.md` (lidos sozinhos por cada equipe) e o `CHANGELOG.md`. Esta ADR organiza o **código**; a raiz continua com essas configurações.

## Decisão

### 1. Camadas

```
src/
├── domain/          regras financeiras puras (Money, transações, identidade)
├── application/     casos de uso que orquestram domínio e infraestrutura
├── infrastructure/  o que fala com o mundo: env, log, banco, auth, Pluggy, extração de prints
├── app/             rotas do Next (páginas e app/api/)
├── components/      componentes de tela, contratos de ViewModel e prévia
└── instrumentation.ts
```

| Antes | Depois | Camada |
| --- | --- | --- |
| `domain/` | `src/domain/` | domínio |
| (não existia) | `src/application/` | casos de uso |
| `lib/` | `src/infrastructure/` | infraestrutura |
| `lib/database/` (previsto na ADR-0027) | `src/infrastructure/database/` | infraestrutura |
| `app/` (inclui `app/api/`) | `src/app/` | apresentação (rotas) |
| `components/` | `src/components/` | apresentação (telas) |
| `instrumentation.ts` | `src/instrumentation.ts` | arranque do Next |
| `tests/lib/` | `tests/infrastructure/` | testes |

Ficam onde estão: `drizzle/` (migrações geradas pelo `drizzle-kit`, com o `drizzle.config.ts` na raiz), `scripts/`, `tests/`, `tools/`, `docs/`, `.claude/`, `.agents/` e `.github/`. O Next aceita `src/app/` sem configuração; os testes continuam em `tests/`, com subpastas por camada.

### 2. Regra de dependência

As setas só apontam para dentro:

```
app, components ──► application ──► domain
infrastructure  ──► application, domain
domain          ──► nada (TypeScript puro, ADR-0017)
```

- `src/domain/` mantém todo o isolamento da ADR-0017, agora no novo caminho.
- `src/application/` não importa `src/infrastructure/`, `src/app/`, `src/components/` nem frameworks (`next`, `react`, `drizzle-orm`, `@supabase/*`). Recebe o que precisa da infraestrutura por parâmetro (portas definidas no próprio caso de uso).
- `src/components/` não importa `src/domain/`, `src/application/` nem `src/infrastructure/` (já era regra da ADR-0028: a tela só recebe ViewModel pronto).
- O lint barra as três regras; um teste em `tests/lint/` prova cada uma.

`src/application/` nasce só com um `README.md`. Ela ganha o primeiro módulo quando surgir o primeiro caso de uso real (o lançamento manual da T2.6, depois `SyncService` e `ImportService`). Uma camada criada sem caso de uso seria uma costura hipotética: ninguém ainda depende dela.

### 3. Áreas das equipes (ADR-0023) nos caminhos novos

| Equipe | Área |
| --- | --- |
| Claude | `src/domain/`, `src/application/`, `src/infrastructure/`, `src/app/api/`, `src/instrumentation.ts`, `src/proxy.ts`, `drizzle/`, `scripts/`, `tests/domain/`, `tests/application/`, `tests/infrastructure/`, `tests/integration/`, `tests/fixtures/`, `tests/lint/` |
| Gemini | `src/app/` (fora de `src/app/api/`), `src/components/`, `src/styles/`, `public/`, `README.md`, `tests/ui/` |
| QA da tarefa | `tests/qa/` |

### 4. Transição em dois PRs

O job `limites` roda com o script da `main` (`pull_request_target`), então a mudança precisa de dois PRs:

1. **`cto/adr-0029-src-camadas` (este):** esta ADR e o `limites.ts` aceitando os caminhos antigos **e** os novos, mais a branch `estrutura/{slug}`.
2. **`estrutura/src-camadas`:** move os arquivos com `git mv`, ajusta imports, configs, lint, testes e documentação, e tira os caminhos antigos do `limites.ts`.

### 5. Branch `estrutura/{slug}`

Uma mudança de estrutura mexe ao mesmo tempo na área das duas equipes e nas configs, e nenhuma branch existente pode fazer isso. Por isso:

- `estrutura/{slug}` pode mexer em qualquer arquivo, **só** se o `{slug}` estiver na lista `ESTRUTURAS_APROVADAS` do `limites.ts`, ligada a uma ADR aceita. Hoje a lista tem só `src-camadas` (esta ADR).
- Quem faz o merge é o **dono**, como nas branches `cto/`.
- Nenhum agente abre uma branch `estrutura/` sem ADR aceita e sem o slug na lista, que só entra por uma branch `cto/`.

## Consequências

- A raiz passa a ter só `src/`, `tests/`, `docs/`, `tools/` e as pastas de agentes e CI, além das configurações obrigatórias.
- O nome de cada pasta diz a camada, e a regra de dependência passa a ser checada pelo lint, não só pela revisão.
- ADRs e cartões já concluídos continuam com os caminhos antigos (são registro); a tabela da seção 1 é a tradução. Cartões ainda abertos e PRs em andamento (#103, cartão da T2.2 e ADR-0027; #104, cartão da T2.10a) precisam trocar os caminhos antes do merge, ou logo depois.
- Branches das equipes abertas antes do PR de estrutura precisam ser refeitas a partir da `origin/main` nova (o Git acompanha a maioria das renomeações, mas imports novos precisam do caminho novo).
