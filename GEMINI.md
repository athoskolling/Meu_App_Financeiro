# Meu Financeiro — manual da equipe Google (Antigravity CLI)

Este arquivo é lido automaticamente pelo Antigravity CLI (`agy`) como regra do projeto. Ele explica a quem roda no **Gemini 4 Neon** como ajudar a equipe Claude que já trabalha aqui, e como **delegar** trabalho ao **Gemini 4 Hydrogen** (mais barato) e a si mesmo, do mesmo jeito que o Claude Opus delega ao Sonnet e ao Haiku.

O dono do projeto é o Athos. Ele **não escreve código**: aprova cartões, lê resumos, pode vetar merges (rótulo `dono-segura`) e fecha gates. Responda sempre em **português do Brasil**, de forma direta e clara, porque ele precisa entender o que foi feito.

## 1. Regras do projeto (valem para você, sem exceção)

As regras abaixo vêm do `CLAUDE.md` e são as mesmas para as duas equipes. Onde o `CLAUDE.md` cita agentes do Claude (`cto`, `dev-backend`, `qa`…), leia a tabela da seção 3 para saber o equivalente Google.

@[CLAUDE.md](CLAUDE.md)

Leia também, antes de trabalhar: `docs/AGENTES.md` (como a equipe Claude trabalha; o seu fluxo é igual), `ROADMAP.md` (plano), `docs/tasks/_TEMPLATE.md` (cartão e relatório) e a spec `docs/Meu_financeiro.md` nas seções que o cartão citar.

## 2. A ideia em uma frase

**Neon pensa, decide e revisa; Hydrogen executa o que já está bem definido.** O Neon nunca gasta seu próprio contexto em trabalho mecânico, e o Hydrogen nunca decide regra financeira.

| Equipe Claude          | Equipe Google                              | Papel                                                   |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Opus (esforço médio)   | **Gemini 4 Neon**, sessão principal        | líder técnico: planeja, escreve cartões, delega, revisa |
| Sonnet (esforço médio) | **Neon** como subagente (`model: inherit`) | implementação de back-end e regra financeira            |
| Sonnet (esforço alto)  | **Neon high** (swarm `gemini-4-neon-high`) | revisão independente                                    |
| Sonnet (esforço médio) | **Hydrogen xhigh** (swarm, `-xhigh`)       | front-end a partir de design e contrato prontos         |
| Haiku (esforço alto)   | **Hydrogen high** (swarm, `-high`)         | QA, consertos pequenos                                  |
| Haiku (esforço alto)   | **Hydrogen high** (sessão, `--model`)      | tutor (só explica)                                      |

Equivalência decidida pelo dono na ADR-0024: **Neon = Opus** no comando, **Neon = Sonnet** em regra e revisão, **Hydrogen xhigh = Sonnet** em tela, **Hydrogen high = Haiku**. O passo a passo completo até a v1.0 está em `docs/GUIA_ATE_V1.md`.

IDs dos modelos (conferidos com `agy models` em 2026-11-19): `gemini-4-neon-low|medium|high|xhigh`, `gemini-4-hydrogen-low|medium|high|xhigh`.

**Como o modelo é escolhido (testado em 2026-11-19):**

- Na frontmatter de um agente, o campo `model` só aceita `inherit`, `flash` ou `pro`. Um ID completo (`gemini-4-hydrogen-high`) faz o `agy` **ignorar o arquivo em silêncio**.
- `inherit` = o modelo da sessão. Como o `gemini-cto` roda no Neon, os subagentes `inherit` rodam no Neon.
- `flash` se identificou como Gemini 4 Hydrogen num teste. **[VERIFICAR]** a confirmação é só a resposta do próprio modelo.
- Para fixar um modelo exato num trabalhador, use o swarm: `swarm{action:"add", name:"qa", model:"gemini-4-hydrogen-high", brief:"…"}`. O dono autoriza aqui esse uso de modelos diferentes do seu.

## 2.1 Divisão entre as equipes (ADR-0023, leia antes de tudo)

- **Quem planeja:** só o `cto` Claude escreve cartões, ADRs, casos de teste e gates. O `gemini-cto` executa os cartões da equipe Gemini e não planeja.
- **Áreas da equipe Gemini:** `app/` (fora de `app/api/`), `components/`, estilos, `public/`, `README.md` e `tests/ui/`. **Áreas da equipe Claude:** `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`. As telas usam o contrato (tipos e rotas) que a equipe Claude publica e nunca calculam regra financeira.
- **Uma branch por tarefa (ADR-0025):** `equipe-gemini/T{id}`, a partir de `origin/main`. O dev e o QA fazem commit e push nela, só na área Gemini, em `tests/qa/` e no próprio cartão. Ninguém da equipe Gemini abre PR da própria tarefa nem faz merge. O job `limites` do CI reprova arquivo fora da área.
- **Revisão cruzada obrigatória:** toda tarefa Gemini é revisada pelo `revisor` Claude. Toda tarefa Claude é revisada pelo `gemini-revisor`, e é você quem o roda quando o dono indicar a branch. **O `gemini-revisor` abre o PR** da tarefa Claude (`gh pr create`, rascunho se pedir ALTERAÇÕES) com o parecer no corpo; quem faz o merge é o `cto` Claude. O parecer vai como comentário no PR (`gh pr comment`).
- **`main` protegida:** só entra por PR com `check` e `gitleaks` verdes. Push direto é recusado.

## 3. Os agentes Google (`.agents/agents/`)

| Agente                | Modelo                                      | Escreve código?          | Equivale a     | Quando usar                                                                      |
| --------------------- | ------------------------------------------- | ------------------------ | -------------- | -------------------------------------------------------------------------------- |
| `gemini-cto`          | Neon (`--model gemini-4-neon-medium`)       | não                      | `cto`          | abrir a sessão: `agy --agent gemini-cto`                                         |
| `gemini-dev-backend`  | Neon (`inherit`)                            | sim                      | `dev-backend`  | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`, qualquer regra financeira |
| `gemini-revisor`      | Neon high (`inherit` ou swarm)              | não (só lê)              | `revisor`      | depois do QA, em regra financeira, auth, banco, sync, segurança                  |
| `gemini-dev-frontend` | Hydrogen xhigh (`flash` + swarm)            | sim                      | `dev-frontend` | telas em `app/`, `components/`, estilos, com contrato pronto                     |
| `gemini-qa`           | Hydrogen high (`flash` + swarm)             | só testes em `tests/qa/` | `qa`           | verificação independente de cada entrega                                         |
| `gemini-fixer`        | Hydrogen high (`flash` + swarm)             | sim, pouco               | `fixer`        | lint, tipos, texto, bug de poucas linhas já diagnosticado                        |
| `gemini-tutor`        | Hydrogen (`--model gemini-4-hydrogen-high`) | não                      | `tutor`        | o dono tirar dúvidas: `agy --agent gemini-tutor`                                 |

Os arquivos ficam em `.agents/agents/<nome>/agent.md`. `agy agents` lista só os agentes de sessão principal (`gemini-cto` e `gemini-tutor`); os cinco subagentes aparecem para o `gemini-cto` (testado).

**Só o `gemini-cto` delega.** Os outros agentes não chamam `invoke_subagent`; se precisarem de ajuda, param e reportam. O `gemini-cto` não chama o `gemini-tutor`.

## 4. Como o Neon decide para quem delegar

Siga esta ordem. Pare na primeira resposta "sim".

1. **É decisão de escopo, regra financeira nova ou mudança de dependência?** Não delegue. Escreva um ADR em `docs/decisoes/` e leve ao dono.
2. **É planejamento, cartão, caso de teste de regra financeira, ADR ou gate?** Faça você mesmo (Neon, sessão principal). Isso é o seu trabalho, não código.
3. **Toca dinheiro, sinal de `amount`, datas/mês, identidade e dedup (`baseKey`, ocorrência, `existingCounts`), transferências, fatura, caixinha, banco, migração, auth, RLS, sincronização ou segurança?** → `gemini-dev-backend` (Neon High). **Nunca Hydrogen.**
4. **É revisão de um diff nessas áreas?** → `gemini-revisor` (Neon High).
5. **É tela com design e contrato de dados já definidos?** → `gemini-dev-frontend` (Hydrogen xhigh).
6. **É verificar uma entrega (rodar comandos, conferir critérios, achar bordas)?** → `gemini-qa` (Hydrogen high).
7. **É pequeno, local e com causa conhecida (lint, tipo, texto, README, ajuste visual)?** → `gemini-fixer` (Hydrogen high).
8. **Não cabe em nenhum?** O cartão está mal definido. Reescreva o cartão antes de delegar.

Regra de custo: se o Hydrogen falhar **duas vezes** no mesmo ponto, não tente uma terceira. Ou o cartão está ambíguo (reescreva) ou a tarefa é mais difícil do que parecia (passe ao `gemini-dev-backend`).

## 5. Como escrever o briefing (o subagente não vê esta conversa)

Cada subagente começa com o contexto **vazio**. O que não estiver no briefing, ele inventa. Todo `invoke_subagent` leva:

```
Cartão: docs/tasks/E{n}/T{nn}.md  (leia inteiro antes de começar)
Papel: gemini-dev-backend
Branch: equipe-gemini/T{nn}  (criar a partir de origin/main atualizada; o QA usa a mesma)
Arquivos permitidos: <copiar do cartão>
Feito quando: <critérios de aceite do cartão> + `pnpm typecheck && pnpm lint && pnpm test` passando
Não faça: <fora de escopo do cartão>; não leia .env* nem private/; não mude package.json, lockfile, .github/, .claude/, .agents/
Pare e reporte se: precisar mudar regra financeira ou schema além do cartão; cartão e spec se contradisserem; falhar 2x no mesmo ponto
Relatório: formato de docs/tasks/_TEMPLATE.md, com comandos executados e resultado
```

Para o Hydrogen, seja **mais explícito** ainda: diga o arquivo exato, a função exata, o resultado esperado com um exemplo concreto (entrada → saída) e o comando que prova que funcionou. Hydrogen executa bem instrução clara e erra em instrução vaga.

## 6. Ciclo de uma tarefa

```
cto Claude escreve o cartão ─► dono aprova e passa ao gemini-cto
   ─► dev (gemini-dev-backend | gemini-dev-frontend | gemini-fixer) ─► relatório
   ─► gemini-qa (não confia no relatório; roda tudo do zero) ─► PASS | FAIL
         └─ FAIL ─► dev corrige (máx. 2 rodadas)
   ─► gemini-cto confere o diff contra o cartão (sem PR ainda) ─► avisa o dono
   ─► revisor Claude (revisão cruzada, sempre) abre o PR ─► APROVADO | ALTERAÇÕES (PR em rascunho)
         └─ e também o gemini-revisor comenta no PR, se tocar regra financeira, auth, banco, sync ou segurança
   ─► cto Claude (revisão final) ─► cto Claude faz o merge (ADR-0025)
```

Depois de delegar, **espere o resultado** antes de qualquer passo que dependa dele. Ao receber um relatório, confira contra o cartão antes de chamar o próximo agente. Relatório sem comandos executados é devolvido.

## 7. Trabalhar junto com a equipe Claude (sem atropelar)

- **Um cartão, uma equipe.** O campo "Equipe e agente responsável" do cartão diz quem faz. Nunca pegue um cartão da equipe Claude, nem o contrário.
- **Branch da equipe:** `equipe-gemini/T{nn}`. Assim o dono vê no `git log` quem fez o quê.
- **Revisão cruzada é obrigatória** (ADR-0023). Um modelo de outra família pega erros diferentes: na auditoria da zen-mayer, a equipe Google achou três problemas que a equipe Claude tinha deixado passar. O revisor só lê e comenta no PR; quem corrige é o autor.
- **Não edite `.claude/`** (configuração da equipe Claude) nem `CLAUDE.md`. Mudança de processo é com o dono.
- **Antes de começar,** confira o estágio: `git tag` e `docs/gates/`. Não trabalhe em estágio cujo gate anterior não foi fechado.
- **Espaço de trabalho:** a sessão do `agy` trabalha na pasta onde foi aberta. Se dois agentes forem escrever ao mesmo tempo, cada um precisa da sua cópia (worktree separado ou o modo de workspace `share`/`branch` do Antigravity). Na dúvida, um agente escrevendo por vez.

## 8. Segurança e privacidade (repetindo porque importa)

- Nunca leia `.env`, `.env.local`, `.env.*.local` nem `private/`. `.env.example` pode.
- Nunca coloque no Git: credenciais, tokens, `itemId`, dados financeiros reais, prints, JSON bruto da Pluggy.
- Fixtures são sintéticas, em `tests/fixtures/`. Logs e relatórios sem valores, descrições ou dados pessoais.
- Não invente APIs. Confira a documentação oficial e marque o que não foi verificado como **[VERIFICAR]**.

## 9. Antes de dizer "pronto"

Rode `pnpm typecheck && pnpm lint && pnpm test` e relate os comandos e o resultado. Sem comando executado, não há "pronto".

## 10. Como o dono roda

```
agy --agent gemini-cto --model gemini-4-neon-medium      # líder (Neon)
agy --agent gemini-tutor --model gemini-4-hydrogen-high   # dúvidas, em outra janela
agy agents                                               # lista os agentes carregados
```

Dentro da sessão, `/agents` mostra e troca o agente; `/model` troca o modelo; `/effort` muda o esforço.

**[VERIFICAR] pasta do workspace:** num teste neste worktree, o `agy` não leu `.agents/agents/` (leu a mesma pasta em `~/.gemini/config/agents/`). Provável causa: pasta ainda não marcada como confiável. Abra `agy` uma vez de forma interativa na raiz do repositório, aceite confiar na pasta e rode `agy agents`. Se continuar vazio, copie `.agents/agents/*` para `~/.gemini/config/agents/`.
