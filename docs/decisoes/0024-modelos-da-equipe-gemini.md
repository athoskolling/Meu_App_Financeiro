# 0024 — Equivalência de modelos entre as equipes Claude e Gemini

- **Status:** aceita pelo dono em 23/11/2026
- **Complementa:** ADR-0023 (divisão das equipes) e a seção 2 do `GEMINI.md`
- **Guia de execução que usa esta decisão:** `docs/equipes/GUIA_ATE_V1.md`

## Contexto

A ADR-0023 dividiu o trabalho entre as equipes Claude e Gemini, mas o `GEMINI.md` punha todo trabalhador barato no Hydrogen padrão (`model: flash`), inclusive o front-end, que na equipe Claude roda no Sonnet. O dono definiu a equivalência para a equipe Gemini ter, em cada papel, um modelo do mesmo nível da equipe Claude.

## Decisão

| Nível na equipe Claude | Modelo na equipe Gemini | Papéis |
| --- | --- | --- |
| Opus, esforço médio | **Gemini 4 Neon** (`gemini-4-neon-medium`) | `cto` ↔ `gemini-cto` |
| Sonnet, quando decide ou revisa regra | **Gemini 4 Neon** (`inherit`; `gemini-4-neon-high` no revisor) | `dev-backend` ↔ `gemini-dev-backend`, `revisor` ↔ `gemini-revisor` |
| Sonnet, quando implementa tela | **Gemini 4 Hydrogen xhigh** (`gemini-4-hydrogen-xhigh`) | `dev-frontend` ↔ `gemini-dev-frontend` |
| Haiku, esforço alto | **Gemini 4 Hydrogen high** (`gemini-4-hydrogen-high`) | `qa` ↔ `gemini-qa`, `fixer` ↔ `gemini-fixer`, `tutor` ↔ `gemini-tutor` |

Como o modelo é fixado no Antigravity CLI (testado em 19/11/2026, ver `GEMINI.md` seção 2):

- A frontmatter de um agente só aceita `inherit`, `flash` ou `pro`. Um ID completo faz o `agy` ignorar o arquivo. Por isso os arquivos continuam com `inherit` (Neon) e `flash` (Hydrogen).
- O **esforço exato** do Hydrogen (`high` ou `xhigh`) só é garantido pelo swarm: `swarm{action:"add", name:"<papel>", model:"gemini-4-hydrogen-xhigh", brief:"…"}`. O `gemini-cto` usa o swarm para os trabalhadores Hydrogen. Se o swarm não estiver disponível, usa `invoke_subagent` com o arquivo do agente (`flash`) e anota no relatório que o esforço não foi fixado.
- Sessões principais usam `--model`: `agy --agent gemini-cto --model gemini-4-neon-medium` e `agy --agent gemini-tutor --model gemini-4-hydrogen-high`.

## Consequências

- O front-end Gemini fica no Hydrogen xhigh, mais caro que o Hydrogen padrão, mas no mesmo nível do Sonnet. A regra de custo continua: se falhar duas vezes no mesmo ponto, o cartão é reescrito ou a tarefa sobe para o Neon.
- O Hydrogen continua **nunca** sendo dono de regra financeira, em qualquer esforço.
- Nada muda na equipe Claude, nas áreas, nas branches nem na cadeia de revisão da ADR-0023.
- **[VERIFICAR]** que `flash` é de fato o Hydrogen (hoje a confirmação é só a resposta do próprio modelo) e que o swarm aceita o sufixo `-xhigh`. O dono confere com `agy models` e um teste curto antes da primeira tarefa Gemini.
- Atualizados junto com esta ADR: `GEMINI.md`, `.agents/agents/` (descrições e instruções do `gemini-cto`), `docs/decisoes/README.md`, `docs/ROADMAP.md`, `CLAUDE.md` e `docs/equipes/AGENTES.md` (só o apontamento para o guia).
