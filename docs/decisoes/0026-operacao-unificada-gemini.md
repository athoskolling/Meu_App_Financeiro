# 0026 — Operação unificada na família Gemini 4 (com retomada imediata do Claude)

- **Status:** aceita pelo dono em 24/11/2026
- **Atualiza em parte:** ADR-0023 (divisão das equipes), ADR-0024 (modelos da equipe Gemini) e ADR-0025 (limites da branch `equipe-gemini/` e cadeia de revisão enquanto o Claude estiver pausado)
- **Verificação automática:** job `limites` (`tools/ci/limites.ts` e `tests/ci/limites.test.ts`)

## Contexto

Para poupar a cota semanal do Claude e concentrar a execução na IDE Antigravity — onde a ferramenta `swarm` está disponível com isolamento de cópia de trabalho (`workspace: "share"`) e as variantes da família Gemini 4 (`Carbon`, `Neon`, `Argon` e `Hydrogen`) compartilham cota diária —, o dono decidiu conduzir temporariamente todas as áreas do projeto (CTO, back-end/domínio, front-end, QA e revisão) apenas com modelos Gemini 4.

Ao mesmo tempo, o dono exigiu que a configuração dos agentes do Claude permaneça intacta para que eles possam retomar o trabalho a qualquer momento, sem precisar reverter código, branches ou regras do CI.

## Decisão

### 1. Modelos por papel na família Gemini 4

Escolhidos pelo dono em 24/11/2026 e fixados pelo `swarm` (ou pela sessão principal):

| Papel | Agente | Modelo e esforço | Como roda | Escopo |
| --- | --- | --- | --- | --- |
| **CTO** | `gemini-cto` | **Gemini 4 Carbon (Medium)** (`gemini-4-carbon-medium`), subindo para **Carbon (High)** (`gemini-4-carbon-high`) em decisões difíceis | sessão principal | planeja, escreve cartões, casos de teste de regra financeira, ADRs e gates; delega; faz revisão final e merge das tarefas |
| **Back-end e domínio** | `gemini-dev-backend` | **Gemini 4 Neon (Medium)** (`gemini-4-neon-medium`) | `swarm` (`workspace: "share"` quando em paralelo) | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`, regras financeiras, banco, auth e sincronização |
| **Front-end** | `gemini-dev-frontend` | **Gemini 4 Hydrogen (XHigh)** (`gemini-4-hydrogen-xhigh`) | `swarm` (`workspace: "share"` quando em paralelo) | `app/` (fora de `app/api/`), `components/`, estilos, com contrato e design prontos |
| **Revisor** | `gemini-revisor` | **Gemini 4 Neon (XHigh)** (`gemini-4-neon-xhigh`) | `swarm` (somente leitura do código) | revisor único enquanto o Claude estiver pausado; abre o PR (`--draft` se pedir ALTERAÇÕES) |
| **QA** | `gemini-qa` | **Gemini 4 Hydrogen (XHigh)** (`gemini-4-hydrogen-xhigh`) | `swarm` | verificação independente do zero e testes novos em `tests/qa/` |
| **Consertos pequenos** | `gemini-fixer` | **Gemini 4 Hydrogen (High)** (`gemini-4-hydrogen-high`) | `swarm` | correções localizadas de poucas linhas, `README.md`, lint e texto |
| **Tutor** | `gemini-tutor` | **Gemini 4 Hydrogen (High)** (`gemini-4-hydrogen-high`) | sessão separada (somente leitura) | explica ao dono, fora do fluxo de tarefas |

O Hydrogen (`gemini-dev-frontend`, `gemini-qa`, `gemini-fixer`) continua **nunca** sendo dono de regra financeira. Se falhar duas vezes no mesmo ponto, o CTO reescreve o cartão ou escala a tarefa ao `gemini-dev-backend` (Neon).

### 2. Branches e job `limites` (prontos para os dois modos)

- **`equipe-gemini/T{id}`:** passa a aceitar no job `limites` tanto a área Gemini quanto a área Claude (`AREA_GEMINI` + `AREA_CLAUDE`), além de `tests/qa/` e do próprio cartão `docs/tasks/E{n}/T{id}.md`. Continua **bloqueando** tudo que não é código da tarefa: `package.json`, lockfile, `.github/`, `.claude/`, `.agents/`, `tools/`, `tests/ci/`, `CLAUDE.md`, `GEMINI.md`, `tsconfig.json`, configs, ADRs, gates e cartões de outras tarefas. O escopo exato dentro de cada tarefa continua verificado pelo QA, pelo revisor e pelo CTO contra a lista "Arquivos permitidos" do cartão (`git diff --name-only`).
- **`equipe-claude/T{id}`:** permanece **inalterada** (`AREA_CLAUDE`, `tests/qa/` e o próprio cartão), bem como todos os arquivos em `.claude/agents/`. Os agentes do Claude podem voltar a qualquer tarefa imediatamente.
- **`cto/{assunto}`:** vale para o CTO ativo (`cto` Claude ou `gemini-cto`), restrito ao que não é código. O merge de branches `cto/` e `claude/` continua exclusivo do **dono** (ADR-0025).

### 3. Cadeia de revisão nos dois modos

- **Enquanto o Claude estiver pausado (modo unificado Gemini):**
  ```
  dev ─► gemini-qa (Hydrogen XHigh) ─► gemini-revisor (Neon XHigh, abre o PR) ─► gemini-cto (Carbon Medium/High, revisão final e merge)
  ```
  Há um único revisor (`gemini-revisor` em `Neon XHigh`), que lê o diff inteiro contra o cartão e a spec e abre o PR (ou `--draft` se pedir ALTERAÇÕES). O `gemini-cto` só faz o merge quando todas as condições da ADR-0025 valem: CI verde (`check`, `gitleaks` e `limites`), QA com PASS no cartão, parecer APROVADO do revisor, revisão final do CTO e ausência do rótulo `dono-segura`.
- **Quando o Claude retomar (duas equipes ativas):**
  Voltam a valer sem alteração de código a divisão preferencial por área da ADR-0023 e a revisão cruzada entre famílias (mais revisão dupla nas áreas críticas) da ADR-0023 e ADR-0025.
- **Cartões já aprovados pelo dono antes desta ADR (como `T1.3` e `T2.5`):** podem seguir em `equipe-gemini/T{id}` pela cadeia unificada acima sem precisar reescrever o cartão, registrando no relatório que executaram sob a ADR-0026.

## Consequências

- O projeto avança sem depender da cota semanal do Claude, mantendo separação estrita de papéis (`Carbon` coordena e fecha; `Neon Medium` implementa domínio/back-end; `Hydrogen XHigh` implementa UI e faz QA; `Neon XHigh` revisa sem editar; `Hydrogen High` faz consertos pequenos e tutoria).
- Durante o modo unificado, perde-se temporariamente a revisão por outra família de modelo (Anthropic × Google), compensada pelo `gemini-revisor` dedicado em `Neon XHigh` e pela revisão final em `Carbon`.
- Nenhuma configuração do Claude é removida ou quebrada: retomar os agentes do Claude exige apenas abrir a sessão do Claude normalmente.
- Atualizados junto com esta ADR: `docs/decisoes/README.md`, `tools/ci/limites.ts`, `tests/ci/limites.test.ts`, `GEMINI.md`, `.agents/agents/*`, `CLAUDE.md` e `docs/equipes/GUIA_ATE_V1.md`.
