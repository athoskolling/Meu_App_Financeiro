# Meu Financeiro — manual da equipe Google (Antigravity)

Este arquivo é lido automaticamente pelo Antigravity como regra do projeto. Ele explica como operar a equipe Google na família **Gemini 4** (`Carbon`, `Neon`, `Hydrogen`), tanto no **modo unificado** (ADR-0026, enquanto o Claude estiver pausado) quanto em **duas equipes** junto com o Claude (ADR-0023).

O dono do projeto é o Athos. Ele **não escreve código**: aprova cartões, lê resumos, pode vetar merges (rótulo `dono-segura`) e fecha gates. Responda sempre em **português do Brasil**, de forma direta e clara, porque ele precisa entender o que foi feito.

## 1. Regras do projeto (valem para você, sem exceção)

As regras abaixo vêm do `CLAUDE.md` e são as mesmas para todas as equipes. Onde o `CLAUDE.md` cita agentes do Claude (`cto`, `dev-backend`, `qa`…), leia a tabela da seção 3 para saber o equivalente Google.

@[CLAUDE.md](CLAUDE.md)

Leia também, antes de trabalhar: `docs/AGENTES.md`, `ROADMAP.md`, `docs/GUIA_ATE_V1.md`, `docs/tasks/_TEMPLATE.md` e a spec `docs/Meu_financeiro.md` nas seções que o cartão citar.

## 2. Modelos por papel (ADR-0026)

**Carbon coordena e fecha; Neon implementa domínio/back-end e revisa em esforço máximo; Hydrogen executa UI, QA e consertos bem definidos.** O CTO não gasta contexto implementando código, e o Hydrogen nunca decide regra financeira.

| Papel no projeto                      | Modelo na equipe Google (ADR-0026)                                                                                                 | Equivale no Claude | O que faz                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| **CTO** (`gemini-cto`)                | **Gemini 4 Carbon (Medium)** (`gemini-4-carbon-medium`), subindo a **Carbon (High)** (`gemini-4-carbon-high`) em decisões difíceis | Opus (médio)       | planeja, escreve cartões/casos de teste/ADRs/gates, delega, faz revisão final e merge de tarefas |
| **Back-end** (`gemini-dev-backend`)   | **Gemini 4 Neon (Medium)** (`swarm`: `gemini-4-neon-medium`)                                                                       | Sonnet (médio)     | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`, regras financeiras, banco, auth e sync    |
| **Front-end** (`gemini-dev-frontend`) | **Gemini 4 Hydrogen (XHigh)** (`swarm`: `gemini-4-hydrogen-xhigh`)                                                                 | Sonnet (médio)     | telas em `app/` (fora de `app/api/`), `components/`, estilos, com contrato e design prontos      |
| **Revisor** (`gemini-revisor`)        | **Gemini 4 Neon (XHigh)** (`swarm`: `gemini-4-neon-xhigh`)                                                                         | Sonnet (alto)      | revisão independente (somente leitura) e abertura de PR                                          |
| **QA** (`gemini-qa`)                  | **Gemini 4 Hydrogen (XHigh)** (`swarm`: `gemini-4-hydrogen-xhigh`)                                                                 | Haiku (alto)       | verificação independente do zero e testes em `tests/qa/`                                         |
| **Fixer** (`gemini-fixer`)            | **Gemini 4 Hydrogen (High)** (`swarm`: `gemini-4-hydrogen-high`)                                                                   | Haiku (alto)       | lint, tipos, texto, `README.md`, conserto pequeno já diagnosticado                               |
| **Tutor** (`gemini-tutor`)            | **Gemini 4 Hydrogen (High)** (`gemini-4-hydrogen-high`)                                                                            | Haiku (alto)       | só explica ao dono em sessão própria; fora do fluxo de tarefas                                   |

**Como o modelo é fixado:**

- Na frontmatter de `.agents/agents/*/agent.md`, o campo `model` só aceita `inherit`, `flash` ou `pro` (um ID completo faz o CLI ignorar o arquivo).
- Na execução, fixe sempre o modelo e o esforço exatos pelo **`swarm`**:
  ```
  swarm{action:"add", name:"dev-backend", model:"gemini-4-neon-medium", workspace:"share", brief:"…"}
  swarm{action:"add", name:"dev-frontend", model:"gemini-4-hydrogen-xhigh", workspace:"share", brief:"…"}
  swarm{action:"add", name:"qa", model:"gemini-4-hydrogen-xhigh", brief:"…"}
  swarm{action:"add", name:"revisor", model:"gemini-4-neon-xhigh", brief:"…"}
  swarm{action:"add", name:"fixer", model:"gemini-4-hydrogen-high", workspace:"share", brief:"…"}
  ```
- Quando dois trabalhadores editarem ao mesmo tempo, passe `workspace:"share"` (cópia isolada equivalente a worktree). Leitores e revisores mantêm `inherit` de workspace.

## 2.1 Modo unificado Gemini (ADR-0026) vs duas equipes com Claude (ADR-0023)

- **Enquanto o Claude estiver pausado (ADR-0026, modo atual):**
  - O `gemini-cto` assume o papel completo de CTO (cartões, casos de teste, ADRs, gates, revisão final e merge das tarefas; branches de processo usam `cto/{assunto}`, cujo merge continua sendo do **dono**).
  - As branches de tarefa usam `equipe-gemini/T{id}` (a partir de `origin/main`) e podem tocar tanto a área Gemini quanto a área Claude (`tools/ci/limites.ts`), continuando impedidas de tocar configs, `package.json`, lockfile, `.github/`, `.claude/`, `.agents/`, ADRs, gates e outros cartões.
  - Há **um único revisor** (`gemini-revisor` em `Neon XHigh`), que abre o PR (`gh pr create`, com `--draft` se pedir ALTERAÇÕES). O `gemini-cto` faz o merge quando `check`, `gitleaks` e `limites` estiverem verdes, QA PASS, parecer APROVADO e sem rótulo `dono-segura`.
- **Quando o Claude retomar (ADR-0023 e ADR-0025):**
  - `.claude/agents/*` e `equipe-claude/T{id}` seguem intactos: não é preciso desfazer nada para os agentes do Claude voltarem.
  - Com as duas equipes ativas, voltam a divisão preferencial por área (Claude no back-end/domínio, Gemini em telas e `README.md`) e a revisão cruzada entre famílias.

## 3. Os agentes Google (`.agents/agents/`)

| Agente                | Modelo (`swarm`)                                       | Escreve código?          | Equivale a     | Quando usar                                                                       |
| --------------------- | ------------------------------------------------------ | ------------------------ | -------------- | --------------------------------------------------------------------------------- |
| `gemini-cto`          | `gemini-4-carbon-medium` (`high` em decisões difíceis) | não                      | `cto`          | sessão principal de coordenação                                                   |
| `gemini-dev-backend`  | `gemini-4-neon-medium`                                 | sim                      | `dev-backend`  | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`, qualquer regra financeira  |
| `gemini-revisor`      | `gemini-4-neon-xhigh`                                  | não (só lê)              | `revisor`      | depois do QA; lê o diff inteiro contra o cartão e a spec e abre/comenta o PR      |
| `gemini-dev-frontend` | `gemini-4-hydrogen-xhigh`                              | sim                      | `dev-frontend` | telas em `app/` (fora de `app/api/`), `components/`, estilos, com contrato pronto |
| `gemini-qa`           | `gemini-4-hydrogen-xhigh`                              | só testes em `tests/qa/` | `qa`           | verificação independente de cada entrega                                          |
| `gemini-fixer`        | `gemini-4-hydrogen-high`                               | sim, pouco               | `fixer`        | lint, tipos, texto, `README.md`, bug de poucas linhas já diagnosticado            |
| `gemini-tutor`        | `gemini-4-hydrogen-high`                               | não                      | `tutor`        | o dono tirar dúvidas em outra conversa/janela                                     |

**Só o `gemini-cto` delega.** Os trabalhadores não delegam a outros agentes; se precisarem de ajuda, param e reportam. O `gemini-cto` não chama o `gemini-tutor`.

## 4. Como o CTO decide para quem delegar

Siga esta ordem. Pare na primeira resposta "sim".

1. **É decisão de escopo, regra financeira nova ou mudança de dependência?** Não delegue. Escreva um ADR em `docs/decisoes/` (branch `cto/…`, subindo para Carbon High se for decisão difícil) e leve ao dono.
2. **É planejamento, cartão, caso de teste de regra financeira, ADR ou gate?** Faça você mesmo (sessão principal). Isso é o seu trabalho, não código.
3. **Toca dinheiro, sinal de `amount`, datas/mês, identidade e dedup (`baseKey`, ocorrência, `existingCounts`), transferências, fatura, caixinha, banco, migração, auth, RLS, sincronização ou segurança?** → `dev-backend` (`gemini-4-neon-medium`). **Nunca Hydrogen.**
4. **É revisão de um diff depois do QA?** → `revisor` (`gemini-4-neon-xhigh`).
5. **É tela com design e contrato de dados já definidos?** → `dev-frontend` (`gemini-4-hydrogen-xhigh`).
6. **É verificar uma entrega (rodar comandos, conferir critérios, achar bordas)?** → `qa` (`gemini-4-hydrogen-xhigh`).
7. **É pequeno, local e com causa conhecida (lint, tipo, texto, README, ajuste visual)?** → `fixer` (`gemini-4-hydrogen-high`).
8. **Não cabe em nenhum?** O cartão está mal definido. Reescreva o cartão antes de delegar.

Regra de custo: se o Hydrogen falhar **duas vezes** no mesmo ponto, não tente uma terceira. Ou o cartão está ambíguo (reescreva) ou a tarefa exige o `gemini-dev-backend` (`Neon Medium`).

## 5. Como escrever o briefing (o trabalhador começa do zero)

Cada trabalhador começa com o contexto **vazio**. O que não estiver no briefing, ele inventa. Todo briefing leva:

```
Cartão: docs/tasks/E{n}/T{nn}.md  (leia inteiro antes de começar, junto com GEMINI.md e CLAUDE.md)
Papel: <gemini-dev-backend | gemini-dev-frontend | gemini-qa | gemini-revisor | gemini-fixer>
Branch: equipe-gemini/T{nn}  (criar a partir de origin/main atualizada; o QA usa a mesma branch)
Arquivos permitidos: <copiar exatamente do cartão>
Feito quando: <critérios de aceite do cartão> + `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` passando
Não faça: <fora de escopo do cartão>; não leia .env* reais nem private/; não mude package.json, lockfile, .github/, .claude/, .agents/ nem configs; não abra PR (só o revisor abre)
Pare e reporte se: precisar mudar regra financeira ou schema além do cartão; cartão e spec se contradisserem; falhar 2x no mesmo ponto
Relatório: preencher a seção correspondente do cartão no formato de docs/tasks/_TEMPLATE.md, com comandos executados e resultado
```

Para o Hydrogen, seja **mais explícito** ainda: indique o arquivo exato, a função ou componente exato, um exemplo concreto (entrada → saída) e o comando que prova que funcionou.

## 6. Ciclo de uma tarefa (modo unificado ADR-0026)

```
gemini-cto escreve o cartão (se ainda não existir) ─► dono aprova
   ─► dev (Neon Medium no back-end | Hydrogen XHigh no front-end | Hydrogen High no fixer) ─► relatório e push em equipe-gemini/T{id}
   ─► gemini-qa (Hydrogen XHigh; não confia no relatório; roda tudo do zero) ─► PASS | FAIL
         └─ FAIL ─► dev corrige (máx. 2 rodadas) ─► QA de novo
   ─► gemini-revisor (Neon XHigh; só lê) abre o PR ─► APROVADO | ALTERAÇÕES (PR em rascunho)
         └─ ALTERAÇÕES ─► dev corrige na mesma branch (conta no limite de 2 rodadas) ─► revisor relê e roda `gh pr ready`
   ─► gemini-cto (Carbon Medium/High) confere o diff final e CI (`check`, `gitleaks`, `limites`) ─► faz o merge (se sem rótulo `dono-segura`) e resume ao dono
```

Quando o Claude retomar, volta o fluxo de duas equipes e revisão cruzada da seção 2 de `docs/GUIA_ATE_V1.md`.

## 7. Convivência com a estrutura do Claude

- **Nunca apague nem quebre `.claude/` ou `CLAUDE.md`.** Os agentes do Claude precisam continuar prontos para retomar a qualquer momento.
- **`main` protegida:** só entra por PR com `check`, `gitleaks` e `limites` verdes. Push direto é recusado. Merge de branches `cto/` e `claude/` é sempre do **dono**.
- **Antes de começar,** confira o estágio: `git tag` e `docs/gates/`. Não trabalhe em estágio cujo gate anterior não foi fechado.

## 8. Segurança e privacidade

- Nunca leia `.env`, `.env.local`, `.env.*.local` nem `private/`. `.env.example` pode.
- Nunca coloque no Git: credenciais, tokens, `itemId`, dados financeiros reais, prints, JSON bruto da Pluggy.
- Fixtures são sintéticas, em `tests/fixtures/`. Logs e relatórios sem valores, descrições ou dados pessoais.
- Não invente APIs. Confira a documentação oficial e marque o que não foi verificado como **[VERIFICAR]**.

## 9. Antes de dizer "pronto"

Rode `pnpm typecheck && pnpm lint && pnpm test` (e `pnpm format:check`) e relate os comandos e o resultado. Sem comando executado, não há "pronto".

## 10. Como o dono roda

- **Na IDE Antigravity:** selecione **Gemini 4 Carbon (Medium)** na conversa principal (subindo para **Carbon (High)** em decisões difíceis); o coordenador usa o `swarm` com os modelos da ADR-0026.
- **No Antigravity CLI (`agy`):**
  ```
  agy --agent gemini-cto --model gemini-4-carbon-medium     # líder (Carbon Medium)
  agy --agent gemini-tutor --model gemini-4-hydrogen-high   # dúvidas, em outra janela
  ```
