# Guia de execução até a v1.0 (duas equipes)

Este é o passo a passo para levar o projeto do ponto atual até a v1.0, com as equipes Claude e Gemini trabalhando juntas. Ele **não substitui** nada: o plano é o `docs/ROADMAP.md`, as regras de equipe são a ADR-0023, os modelos são as ADRs 0024 e 0026, e cada tarefa continua precisando de um cartão em `docs/tasks/`. Este guia junta tudo numa ordem que você segue de cima para baixo.

> **Nota — Modo unificado em Gemini 4 (ADR-0026, ativo desde 24/11/2026 enquanto o Claude estiver pausado):** para poupar a cota do Claude, o `gemini-cto` (**Carbon Medium**, subindo a **Carbon High** em decisões difíceis) assume o papel de CTO completo e delega pelo `swarm` para `gemini-dev-backend` (**Neon Medium**), `gemini-dev-frontend` (**Hydrogen XHigh**), `gemini-qa` (**Hydrogen XHigh**), `gemini-revisor` único (**Neon XHigh**, que abre o PR) e `gemini-fixer` (**Hydrogen High**), usando branches `equipe-gemini/T{id}` (e `cto/{assunto}` para docs/ADRs/cartões). Tudo em `.claude/` e `equipe-claude/T{id}` segue intacto: basta abrir o Claude quando quiser retomar o fluxo de duas equipes abaixo.

Situação em 27/11/2026, com os gates renumerados por trilha (ADR-0030; índice em `docs/gates/README.md`): **G0 fechado** (`v0.0`). **G1** em conferência: T1.1, T1.2 e T1.3 mescladas. **G2** (telas com prévia, ADR-0028): T2.5, T2.5b e T4.3a mescladas; faltam T4.4a, T3.7a, T5.6a e T5.6b. **G3**: T2.1 na `main`, com o critério do Docker não verificado.

---

## 1. Montar as equipes (uma vez)

### 1.1 Quem é quem

| Papel | Equipe Claude | Equipe Gemini | Escreve código? |
| --- | --- | --- | --- |
| Líder | `cto`: **Opus**, esforço médio | `gemini-cto`: **Neon** (`gemini-4-neon-medium`) | não |
| Back-end e regra financeira | `dev-backend`: **Sonnet**, médio | `gemini-dev-backend`: **Neon** (`inherit`), só se um cartão mandar | sim |
| Revisor | `revisor`: **Sonnet**, alto | `gemini-revisor`: **Neon** (`gemini-4-neon-high`) | não, só lê |
| Front-end | `dev-frontend`: **Sonnet**, médio | `gemini-dev-frontend`: **Hydrogen xhigh** (`gemini-4-hydrogen-xhigh`) | sim |
| QA | `qa`: **Haiku**, alto | `gemini-qa`: **Hydrogen high** (`gemini-4-hydrogen-high`) | só testes |
| Consertos pequenos | `fixer`: **Haiku**, alto | `gemini-fixer`: **Hydrogen high** | sim, pouco |
| Tutor (só para você) | `tutor`: **Haiku**, alto | `gemini-tutor`: **Hydrogen high** | não |

Em resumo: **Neon = Opus** no comando, **Neon = Sonnet** quando o trabalho é regra ou revisão, **Hydrogen xhigh = Sonnet** quando é tela, **Hydrogen high = Haiku**.

### 1.2 Quem cuida de qual pasta (ADR-0023)

| Equipe | Pastas |
| --- | --- |
| **Claude** | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`, `middleware.ts` ou `proxy.ts` (Next 16), `instrumentation.ts`, `tests/domain/`, `tests/lib/`, `tests/integration/`, `tests/fixtures/` |
| **Gemini** | `app/` (fora de `app/api/`), `components/`, estilos, `public/`, `README.md`, `tests/ui/` |
| Só `cto` Claude ou você | `package.json`, lockfile, `.github/`, `.claude/`, `.agents/`, `tools/`, `tests/ci/`, `CLAUDE.md`, `GEMINI.md`, configs, `.env.example`, `LICENSE`, `docs/` |

`tests/qa/` é do QA da equipe que fez a tarefa.

### 1.2.1 Em que branch cada um faz commit (ADR-0025)

| Branch | Quem faz commit | Pode mexer em | Quem faz o merge |
| --- | --- | --- | --- |
| `equipe-claude/T{id}` | dev e QA Claude | área Claude, `tests/qa/`, o próprio cartão | `cto` |
| `equipe-gemini/T{id}` | dev e QA Gemini | área Gemini, `tests/qa/`, o próprio cartão | `cto` |
| `cto/{assunto}` | só o `cto` | o que não é código: docs, cartões, ADRs, gates, configs, dependências | **você** |
| `claude/{nome}` (sessão de nuvem) | a sessão | igual a `cto/` | **você** |
| `main` | ninguém | — | — |

O job `limites` do CI reprova o PR se a branch estiver fora do padrão ou mexer fora da área. Para ele bloquear de verdade, marque `limites` como obrigatório na regra da `main` no GitHub (veja 1.4).

### 1.3 Onde os agentes ficam

- **Claude:** `.claude/agents/<nome>.md`. Na frontmatter, `model` (`opus`, `sonnet`, `haiku`) e `effort` (`medium`, `high`). Já estão prontos; não precisa mudar nada.
- **Gemini:** `.agents/agents/<nome>/agent.md`. Na frontmatter, `model` só aceita `inherit`, `flash` ou `pro`. Um ID completo faz o `agy` ignorar o arquivo **sem avisar**. Por isso:
  - `gemini-cto` roda com `--model gemini-4-neon-medium` na linha de comando;
  - `gemini-dev-backend` e `gemini-revisor` usam `inherit`, ou seja, rodam no Neon da sessão;
  - `gemini-dev-frontend`, `gemini-qa` e `gemini-fixer` usam `flash` (Hydrogen). Para fixar o esforço, o `gemini-cto` cria o trabalhador pelo swarm, com o ID exato:
    ```
    swarm{action:"add", name:"dev-frontend", model:"gemini-4-hydrogen-xhigh", brief:"<briefing do GEMINI.md seção 5>"}
    swarm{action:"add", name:"qa", model:"gemini-4-hydrogen-high", brief:"…"}
    swarm{action:"add", name:"revisor", model:"gemini-4-neon-high", brief:"…"}
    ```
  - `gemini-tutor` roda com `--model gemini-4-hydrogen-high`.

### 1.4 Checklist da sua máquina (uma vez)

- [ ] Claude Code atualizado (v2.1.293 ou mais novo).
- [ ] Antigravity CLI instalado. Na raiz do repositório, rode `agy` uma vez, aceite confiar na pasta e confira com `agy agents` que aparecem `gemini-cto` e `gemini-tutor`. Se a lista vier vazia, copie `.agents/agents/*` para `~/.gemini/config/agents/`.
- [ ] `agy models`: confira que `gemini-4-neon-medium`, `gemini-4-neon-high`, `gemini-4-hydrogen-high` e `gemini-4-hydrogen-xhigh` existem. **[VERIFICAR]** num teste curto se o swarm aceita o sufixo `-xhigh` (ADR-0024).
- [ ] `gh auth status` funcionando nas duas ferramentas, porque os revisores comentam no PR.
- [ ] Docker Desktop instalado e ligado. O G3 precisa dele para os testes de banco.
- [ ] No GitHub, na regra da `main` (Settings → Branches ou Rulesets): marcar **`limites`** como verificação obrigatória, ao lado de `check` e `gitleaks`. Criar o rótulo **`dono-segura`** (Issues → Labels), que é o seu veto de merge.

### 1.5 As janelas de trabalho

| Janela | Comando | Para quê |
| --- | --- | --- |
| 1 | `claude --agent cto` | planejar, escrever cartões, rodar a equipe Claude, revisão final |
| 2 | `agy --agent gemini-cto --model gemini-4-neon-medium` | rodar a equipe Gemini e a revisão cruzada das tarefas Claude |
| 3 (quando tiver dúvida) | `claude --agent tutor` ou `agy --agent gemini-tutor --model gemini-4-hydrogen-high` | entender o que foi feito |

As equipes **não conversam entre si**. Você só avisa a outra janela qual branch está pronta para revisão. Daí em diante, o revisor abre o PR e o `cto` faz o merge.

---

## 2. O ciclo de cada tarefa

Siga sempre esta ordem. Nenhum passo pode ser pulado.

1. **Cartão.** Na janela 1: _"Escreva o cartão da T{nn}."_ O `cto` cria `docs/tasks/E{n}/T{nn}.md` com a equipe, as pastas permitidas, o contrato (se for tela) e os critérios de aceite. Em regra financeira, ele escreve também os casos de teste.
2. **Você aprova o cartão.** Leia o objetivo, as pastas permitidas e os critérios. Se tiver dúvida, pergunte ao tutor. Responda _"aprovado"_ ou peça mudança.
3. **Dev.** Tarefa Claude: _"Delegue a T{nn} ao dev-backend."_ Tarefa Gemini, na janela 2: _"Execute o cartão docs/tasks/E{n}/T{nn}.md."_ O dev trabalha na branch `equipe-claude/T{nn}` ou `equipe-gemini/T{nn}`.
4. **QA da mesma equipe**, na mesma branch. O QA roda tudo do zero e devolve PASS ou FAIL. Com FAIL, o dev corrige. São no máximo 2 rodadas; depois o `cto` reescreve o cartão ou chama você.
5. **O líder da equipe confere o diff** e faz push da branch. **Ninguém da equipe autora abre PR.**
6. **Revisão cruzada (sempre): o revisor abre o PR.** Leve o nome da branch para a outra janela:
   - Tarefa Claude, na janela 2: _"Rode o gemini-revisor na branch equipe-claude/T{id} e abra o PR."_
   - Tarefa Gemini, na janela 1: _"Rode o revisor na branch equipe-gemini/T{id} e abra o PR."_

   Com APROVADO, o PR sai normal. Com ALTERAÇÕES, sai em rascunho, e o parecer vai no corpo do PR.
7. **Revisão da mesma equipe**, comentada no PR, quando a tarefa toca regra financeira, banco, migração, auth, RLS, sincronização ou segurança. Na prática, isso vale para quase toda tarefa Claude.
8. **Correções.** Se algum revisor pedir ALTERAÇÕES, quem corrige é o dev da equipe autora, na mesma branch. O revisor relê, comenta APROVADO e tira o PR do rascunho (`gh pr ready`).
9. **Revisão final e merge pelo `cto`**, na janela 1: _"Faça a revisão final do PR #N e o merge."_ Ele só faz o merge com CI verde (`check`, `gitleaks`, `limites`), os pareceres APROVADO, o QA com PASS e sem o rótulo `dono-segura`.
10. **Você lê o resumo depois.** Se quiser olhar antes, ponha o rótulo `dono-segura` no PR: o `cto` não faz o merge até você tirar.

**Limites:** no máximo **3 agentes escrevendo ao mesmo tempo**, somando as duas equipes. Duas tarefas só andam juntas se as pastas permitidas não se cruzam. Uma tela só começa quando o cartão tem o **contrato** (tipos e rotas) que ela consome.

---

## 3. O caminho completo, gate por gate

Legenda dos revisores: **X** = revisor da outra equipe (sempre); **X+M** = os dois revisores. QA-C é o `qa` Claude, QA-G é o `gemini-qa`.

### G1 — Núcleo de domínio (antes E1 parte A; tag `v0.1`)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T1.3 | Identidade e dedup | Claude, `dev-backend` | X+M | cartão aprovado por você, ADR-0022 aceita |
| T1.4 | Ataque de testes em `tests/qa/` | Claude, `qa` | X | T1.3 |
| T1.4r | Revisão de T1.1 a T1.3 | `revisor` **e** `gemini-revisor` | — | T1.4 |
| T1.4g | Gate G1 | `cto` + **você** | — | tudo acima |

**Você:** aprovar o cartão da T1.3 e a ADR-0022; responder às perguntas do `docs/gates/G1-nucleo-de-dominio.md` com a ajuda do tutor; criar a tag `v0.1`.

### G2 — Telas com prévia (trilha visual, ADR-0028; tag `v0.2`)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T2.5 | Shell inicial e tela Entrar (mesclada, #30) | **Gemini**, `gemini-dev-frontend` | X | T2.1 |
| T2.5b | Tokens, cabeçalho, navegação no celular, selos, `FaixaPrevia`, contratos de ViewModel (mesclada, #114) | **Gemini**, `gemini-dev-frontend` | X | T2.5 |
| T4.3a | Painel com prévia (mesclada, #115) | **Gemini**, `gemini-dev-frontend` | X | T2.5b |
| T4.4a | Transações com prévia | **Gemini**, `gemini-dev-frontend` | X | T2.5b |
| T3.7a | Contas e patrimônio com prévia | **Gemini**, `gemini-dev-frontend` | X | T2.5b |
| T5.6a | Enviar print do Caju com prévia | **Gemini**, `gemini-dev-frontend` | X | T2.5b |
| T5.6b | Revisar print do Caju com prévia | **Gemini**, `gemini-dev-frontend` | X | T2.5b |

**Você:** aprovar a ADR-0028 (ainda está como "proposta"); conferir as seis telas nos screenshots do QA, em 1280px e 360px; fechar o `docs/gates/G2-telas-com-previa.md` e criar a tag `v0.2`. A aprovação visual da T5.6b libera o back-end (G3, G4 e G5).

### G3 — Esqueleto do back-end (antes E2; tag `v0.3`)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T2.1 | Base Next.js (feito) | — | — | falta verificar o Docker: o QA da T2.2 fecha isso |
| T2.2 | Schema Drizzle, migrações, RLS, índice único | Claude, `dev-backend` | X+M | T2.1 |
| T2.3 | Supabase, Google OAuth, Vercel e variáveis | **você** | — | T2.1 |
| T2.4 | Auth: login Google e guarda `OWNER_EMAIL` | Claude, `dev-backend` | X+M | T2.2, T2.3 |
| T2.5 | Layout, navegação e tela Entrar (feita; conta no G2) | **Gemini**, `gemini-dev-frontend` | X | T2.1 |
| T2.6 | Lançamento manual: repositório e serviço | Claude, `dev-backend` | X+M | T2.2, T1.3 |
| T2.7 | Formulário e lista do lançamento manual | **Gemini**, `gemini-dev-frontend` | X | T2.5, T2.6 (contrato) |
| T2.8 | Testes de integração com Postgres em Docker | Claude, `qa` | X | T2.4, T2.6 |
| T2.9 | Deploy na Vercel e teste de fumaça | **você** + Claude, `dev-backend` | X+M | T2.4, T2.7 |
| T2.10a | README de instalação | **Gemini**, `gemini-fixer` | X | qualquer momento |
| T2.10b | `.env.example` sincronizado | `cto` | X | qualquer momento |
| T2.11 | Gate G3 | `cto` + **você** | — | tudo acima |

### G4 — Regras de relatório (antes E1 parte B; tag `v0.4`; precisa fechar antes do G7)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T1.5 | Casos de teste das Tarefas 5, 6 e 7 | `cto`, **você aprova** | — | T1.2 |
| T1.6 | Gastos do período (`spendingForPeriod`) | Claude, `dev-backend` | X+M | T1.5, T1.3 |
| T1.7 | Transferências internas | Claude, `dev-backend` | X+M | T1.5, T1.3 |
| T1.8 | Categorizador | Claude, `dev-backend` | X+M | T1.5, T1.2 |
| T1.9 | Verificação independente | Claude, `qa` | — | T1.6 a T1.8 |
| T1.9r | Revisão de T1.6 a T1.8 | `revisor` **e** `gemini-revisor` | — | T1.9 |
| T1.10 | Gate G4 | `cto` + **você** | — | tudo acima |

### G5 — Sondagem Pluggy (antes E1b; sem tag; anda junto com o G3 e o G4)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T1b.1 | Conta Pluggy, MeuPluggy, autorizar Santander e Nubank | **você** | — | — (faça tudo no mesmo dia, por causa do trial) |
| T1b.2 | Script `scripts/probe/` e relatório só de estrutura | Claude, `dev-backend` | X+M (segurança) | T1b.1 |
| T1b.3 | Rodar o script com as credenciais reais | **você** | — | T1b.2 |
| T1b.4 | Anonimizador e fixtures fictícias | Claude, `dev-backend` | X+M | T1b.3; **você revisa as fixtures antes do commit** |
| T1b.5 | Varredura das fixtures | Claude, `qa` | X | T1b.4 |
| T1b.6 | Responder os `[VERIFICAR]` da spec | `cto` + **você** | — | T1b.5 |

Nenhum agente lê `private/` nem `.env.local`. Eles só veem o relatório de estrutura e as fixtures sintéticas.

### G6 — Ingestão Pluggy (antes E3; tag `v0.5`)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T3.1 | Decidir Q15 (sincronização), ADR | `cto` + **você** | — | G3, G5 |
| T3.2 | Cliente Pluggy com mocks | Claude, `dev-backend` | X+M | T3.1 |
| T3.3 | Mapper para `NormalizedTransaction` | Claude, `dev-backend` | X+M | T3.2, T1.2 |
| T3.4 | `SyncService` com lock e `assignIdentities` | Claude, `dev-backend` | X+M | T3.3, T1.3 |
| T3.5 | Holdings e conferência de lacunas | Claude, `dev-backend` | X+M | T3.4 |
| T3.6 | Rota do cron e sincronização manual | Claude, `dev-backend` | X+M | T3.4 |
| T3.7 | Tela Contas e status no cabeçalho | **Gemini**, `gemini-dev-frontend` | X | T3.5, T3.6 (contrato) |
| T3.8 | Testes de sincronização | Claude, `qa` | X | T3.4 a T3.6 |
| T3.9 | Primeira sincronização real; conferir saldos | **você** | — | T3.8 |
| T3.10 | Gate G6 | `cto` + **você** | — | tudo acima |

### G7 — Painel e relatórios com dados reais (antes E4; tag `v0.6`)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T4.1 | Consultas do painel (só `spendingForPeriod`) | Claude, `dev-backend` | X+M | G6, G4 |
| T4.2 | Categorização integrada e `merchant_rules` | Claude, `dev-backend` | X+M | T4.1 |
| T4.3 | Painel | **Gemini**, `gemini-dev-frontend` | X | T4.1 (contrato) |
| T4.4 | Transações: filtros, busca e recategorização | **Gemini**, `gemini-dev-frontend` | X | T4.2 (contrato) |
| T4.5a | Testes da camada de consulta | Claude, `qa` | X | T4.1, T4.2 |
| T4.5b | Testes de componentes e checklist de acessibilidade | **Gemini**, `gemini-qa` | X | T4.3, T4.4 |
| T4.6 | Conferir um mês fechado ao centavo | **você** | — | T4.3 |
| T4.7 | Textos e estados vazios | **Gemini**, `gemini-fixer` | X | T4.3 |
| T4.8 | Gate G7 | `cto` + **você** | — | tudo acima |

### G8 — Caju por prints (antes E5; tag `v0.7`; começa depois do G3, em paralelo ao G6 e ao G7)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T5.0 | Um print do Caju por semana, anonimizado, fora do Git | **você** | — | **comece já** |
| T5.1 | Decidir Q14 e Q16; casos do parser | `cto` + **você** | — | T5.0, G3 |
| T5.2 | Parser em `domain/caju/` | Claude, `dev-backend` | X+M | T5.1 |
| T5.3 | `ExtractionProvider` e script de avaliação | Claude, `dev-backend` | X+M | T5.1 |
| T5.4 | Mesclador de prints e âncora | `cto` desenha, **você aprova**, Claude `dev-backend` faz | X+M | T5.1, T1.3 |
| T5.5 | `ImportService`; nada em `transactions` sem confirmação | Claude, `dev-backend` | X+M | T5.2, T5.4 |
| T5.6 | Telas Enviar e Revisar | **Gemini**, `gemini-dev-frontend` | X | T5.5 (contrato) |
| T5.7a | Testes do fluxo por API | Claude, `qa` | X | T5.5 |
| T5.7b | Testes das telas (saldo que não fecha bloqueia) | **Gemini**, `gemini-qa` | X | T5.6 |
| T5.8 | Medir a taxa de correção (4 semanas ou mais) | **você** + Claude, `dev-backend` | X | T5.7a, T5.7b |
| T5.9 | Gate G8 | `cto` + **você** | — | tudo acima |

### G9 — Fechamento (antes E6; tag `v1.0`)

| Tarefa | O quê | Equipe e agente | Revisores | Depende de |
| --- | --- | --- | --- | --- |
| T6.1 | Exportação JSON e CSV | Claude, `dev-backend` | X+M | G7 |
| T6.2 | Dump e restauração num banco vazio | **você** + Claude, `qa` | — | T6.1 |
| T6.3 | Seguir o README do zero num ambiente limpo | **Gemini**, `gemini-qa` (correções: `gemini-fixer`) | X | — |
| T6.4 | gitleaks no histórico inteiro e `LICENSE` | Claude, `qa` + `cto` | X | — |
| T6.5 | Gate G9 e revisão final | `cto` + **você** | — | tudo acima |

As tarefas que viraram "a" e "b" (T2.10, T4.5, T5.7) foram divididas porque cada metade cai na pasta de uma equipe (ADR-0023). O `cto` escreve um cartão para cada metade.

---

## 4. Ordem de execução em ondas

Cada onda pode andar em paralelo, respeitando o limite de 3 agentes escrevendo. Comece a onda seguinte quando a anterior liberar as dependências.

| Onda | Equipe Claude | Equipe Gemini | Você |
| --- | --- | --- | --- |
| **1 (agora)** | conferir T1.4 e T1.4r | T4.4a; T3.7a | aprovar a ADR-0028; gate G1 (`v0.1`); T5.0 (já) |
| 2 | revisão cruzada das telas | T5.6a; T5.6b | aprovar as seis telas; gate G2 (`v0.2`); T2.3; T1b.1 |
| 3 | T2.2; T1b.2 | T2.10a (README); revisão cruzada da T2.2 | T1b.3; aprovar os casos da T1.5 |
| 4 | T2.4; T2.6; T1.6; T1b.4 → T1b.5 | revisão cruzada de T2.4 e T2.6 | revisar as fixtures |
| 5 | T2.8; T1.7; T1.8 → T1.9 → T1.9r | T2.7 | T2.9 (deploy); gate G3 (`v0.3`) |
| 6 | T3.1 → T3.2 → T3.3; T5.1 → T5.2 | revisão cruzada | gate G4 (`v0.4`); T1b.6 e gate G5; decidir Q15, Q14 e Q16 |
| 7 | T3.4 → T3.5, T3.6; T5.3; T5.4 | revisão cruzada | aprovar o desenho do mesclador |
| 8 | T3.8; T5.5 → T5.7a | T3.7 | T3.9 (saldos reais); gate G6 (`v0.5`) |
| 9 | T4.1 → T4.2 → T4.5a | T5.6 → T5.7b; T4.3 | T5.8 (medição) |
| 10 | T6.1 | T4.4 → T4.5b; T4.7 | T4.6; gates G7 (`v0.6`) e G8 (`v0.7`) |
| 11 | T6.2; T6.4 | T6.3 | gate G9 (`v1.0`) |

Onde há seta (→), a ordem é obrigatória. Onde há ponto e vírgula (;), as tarefas podem andar juntas.

---

## 5. Como fechar um gate

1. Peça ao `cto`: _"Prepare o gate G{n}."_ Ele preenche `docs/gates/G{n}-*.md` com a evidência de cada item: PR, teste e comando. A ordem e o estado de todos os gates estão em `docs/gates/README.md`.
2. Para cada pergunta de explicação do gate, estude com o tutor e escreva a resposta **com as suas palavras**. Isso é a prova de que você entende o que está aprovando.
3. Itens que só você confere (saldos, mês fechado, restauração do dump): faça e anote o resultado, **sem valores reais** no arquivo.
4. Marque o gate como fechado, faça o merge do PR do gate (branch `cto/`) e crie a tag da tabela de `docs/gates/README.md` (`git tag v0.{n}` e `git push --tags`).
5. Os gates fecham na ordem dos números (ADR-0030); o trabalho do gate seguinte pode já estar andando.

---

## 6. Quando algo dá errado

| Situação | O que fazer |
| --- | --- |
| Duas rodadas de FAIL na mesma tarefa | O `cto` reescreve o cartão ou divide a tarefa. Não peça a terceira rodada. |
| O Hydrogen erra duas vezes no mesmo ponto | O `gemini-cto` reescreve o briefing ou passa para o Neon. |
| Os revisores discordam | O `cto` decide e registra o motivo no cartão. Se for regra financeira, vira ADR. |
| A tela precisa de um dado que o contrato não tem | A tela para. O `cto` escreve um cartão Claude para publicar o dado. A interface nunca calcula. |
| Um agente mexeu em pasta fora da área | O PR volta. Arquivo fora da área é motivo de devolução. |
| Uma sessão criou uma branch fora do padrão (`claude/...`) | Ela não vira PR de tarefa. O `cto` decide se o conteúdo é aproveitado num cartão. |
| Mudança de escopo, dependência ou regra | Vira ADR em `docs/decisoes/` antes de qualquer código. |
| Você não entendeu algo | Pergunte ao tutor. Ele só explica e não muda nada. |

---

## 7. Frases prontas

- **Abrir o dia (janela 1):** _"Em que estágio estamos? Liste o que está desbloqueado para cada equipe e o que espera por mim."_
- **Abrir o dia (janela 2):** _"Liste os cartões Gemini desbloqueados e os PRs Claude que esperam revisão cruzada."_
- **Pedir um cartão:** _"Escreva o cartão da T{nn}, com a equipe certa pela ADR-0023 e o contrato, se for tela."_
- **Mandar a Gemini trabalhar:** _"Execute o cartão docs/tasks/E{n}/T{nn}.md. Use o swarm com o modelo da ADR-0024."_
- **Revisão cruzada:** _"Rode o gemini-revisor na branch equipe-claude/T{id} e abra o PR."_ ou _"Rode o revisor na branch equipe-gemini/T{id} e abra o PR."_
- **Fechar a tarefa:** _"Faça a revisão final do PR #N e, se tudo estiver verde e aprovado, o merge."_
- **Segurar um merge:** ponha o rótulo `dono-segura` no PR.
