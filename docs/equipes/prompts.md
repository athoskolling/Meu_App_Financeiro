# Prompts prontos, em ordem, para cada equipe

Escrito em 19/11/2026. Segue a ADR-0023 (divisão por área, uma branch por tarefa, revisão cruzada) e a conclusão da auditoria (`docs/historico/auditoria-zen-mayer/debate.md`). Faça as etapas na ordem. Dentro de uma etapa, os blocos **Claude** e **Gemini** podem rodar ao mesmo tempo.

## Antes de começar: as duas sessões no Orca

Cada equipe precisa da sua própria pasta, porque as duas escrevem ao mesmo tempo.

1. No Orca, crie **dois workspaces** a partir da `main`, um chamado `claude` e outro chamado `gemini`.
2. No workspace `claude`, abra um terminal e rode `claude --agent cto`.
3. No workspace `gemini`, abra um terminal e rode `agy --agent gemini-cto --model gemini-4-neon-medium`.
4. Para tirar dúvidas, use uma terceira aba: `claude --agent tutor`.

**Como ler os blocos abaixo:** 🟦 é para a sessão `cto` Claude, 🟩 para a sessão `gemini-cto` e 🟨 é com você. Copie o texto do bloco e cole na sessão indicada.

**As equipes não se falam sozinhas.** Quando um PR ficar pronto, use os prompts de revisão cruzada do fim deste arquivo.

---

## Etapa 0 — Primeiro teste da revisão cruzada

🟩 **Gemini**

```
Revise o PR #24 como gemini-revisor (revisão cruzada, ADR-0023). Ele só reorganiza a pasta docs/ e cria este arquivo de prompts. Confira se algum caminho citado nos arquivos ficou quebrado (rode git grep pelos caminhos antigos: docs/Meu_financeiro.md, docs/Fase0_roteiro.md, docs/AGENTES.md, docs/auditoria, docs/delegacao) e se a ordem das etapas em docs/equipes/prompts.md respeita as dependências do ROADMAP.md. Publique o parecer como comentário no PR com gh pr comment.
```

🟨 **Você:** leia o comentário. Se for APROVADO, faça o merge do PR #24.

---

## Etapa 1 — Decisões que travam o começo

🟦 **Claude**

```
Leia a "Conclusão conjunta" de docs/historico/auditoria-zen-mayer/debate.md e as decisões do dono nos dois G3 (docs/historico/auditoria-zen-mayer/claude/zen-mayer-G3-avaliacao.md e gemini/zen-mayer-G3-avaliacao.md). Apresente para mim, uma de cada vez e em linguagem simples, só as decisões que travam a T1.3, a T2.1s e a T2.2: (1) aprovar ou não a ADR-0022; (2) transactions.posted_at como date ou timestamptz; (3) RISCO-T2.2-QA-02, FK simples ou composta com user_id; (4) consolidar ou não as migrações 0000+0002+0003; (5) aprovar as dependências da ADR-0021 e a emenda da ADR-0019 para o next 16.4.6. Para cada uma, diga a sua recomendação e o que muda se eu escolher a outra. Depois que eu responder, registre as decisões nas ADRs (a 0020 e a 0021 vêm da tag arquivo/zen-mayer-E1-E2) numa branch equipe-claude/decisoes-E1A-E2 e abra um PR.
```

🟨 **Você:** responda às perguntas. A revisão cruzada do PR das decisões é o prompt R1 (fim do arquivo).

---

## Etapa 2 — Cartões das próximas tarefas

🟦 **Claude** (depois do merge das decisões)

```
Escreva os cartões, seguindo a ADR-0023 e docs/tasks/_TEMPLATE.md, numa branch equipe-claude/cartoes-E1A-E2, e abra um PR:
- T1.3 (equipe Claude): use o cartão que já está em docs/tasks/E1/T1.3.md. Acrescente que o código parte de domain/transactions/identity.ts e index.ts da tag arquivo/zen-mayer-E1-E2, que os casos C2.1 a C2.14 entram em tests/domain/transactions/identity.test.ts e que o NBSP da linha 39 precisa ser corrigido (ver G4 Gemini).
- T2.1s (equipe Claude): a subida do next, com a emenda da ADR-0019.
- T2.2 (equipe Claude): o banco, aproveitando drizzle/ e lib/database/ da tag, com as decisões da etapa 1.
- T2.12 (cto ou dono): Postgres 17.11 no CI (.github/workflows/ci.yml), para os testes de banco rodarem em todo PR.
- T2.5 (equipe Gemini): o shell da interface, aproveitando app/ e components/ da tag. Sem o next-env.d.ts, e com o texto da tela Entrar honesto.
- T2.10 (equipe Gemini): o README de instalação.
Em cada cartão, diga o que copiar da tag (arquivos exatos) e o que fazer do zero.
```

🟨 **Você:** aprove os cartões e faça o merge.

---

## Etapa 3 — Primeiras tarefas, em paralelo

🟦 **Claude**

```
Delegue a T1.3 ao dev-backend (branch equipe-claude/T1.3, a partir de origin/main). Primeiro os testes, depois o código. Depois do dev, rode o qa na mesma branch. Quando o QA der PASS, abra o PR e me diga o número, para eu pedir a revisão cruzada ao Gemini. Depois rode o revisor Claude no mesmo PR (é regra financeira, então os dois revisores olham).
```

🟩 **Gemini**

```
Execute o cartão docs/tasks/E2/T2.5.md com o gemini-dev-frontend, na branch equipe-gemini/T2.5, a partir de origin/main. Depois rode o gemini-qa na mesma branch (telas em 390 e 1280 px, foco visível, alvos de pelo menos 44 px, pnpm build verde). Confira o diff contra o cartão, abra o PR e me diga o número.
```

🟨 **Você:** quando cada PR estiver aberto, use R1 ou R2 para a revisão cruzada. Depois, o `cto` Claude faz a revisão final e você faz o merge.

---

## Etapa 4 — Gate E1 parte A (v0.1)

🟦 **Claude** (depois do merge da T1.3)

```
Faça a T1.4g: prepare docs/gates/E1.md (parte A) com as evidências da T1.1 à T1.3, numa branch equipe-claude/gate-E1A, e me faça as perguntas de explicação do gate. Quando eu responder, eu fecho o gate e criamos a tag v0.1.
```

🟩 **Gemini** (em paralelo)

```
Execute o cartão docs/tasks/E2/T2.10.md (README de instalação) com o gemini-fixer, na branch equipe-gemini/T2.10. Rode o gemini-qa, abra o PR e me diga o número.
```

---

## Etapa 5 — Banco e CI

🟦 **Claude**

```
Delegue em sequência: (1) a T2.1s ao dev-backend, na branch equipe-claude/T2.1s; (2) depois do merge dela, a T2.2, na branch equipe-claude/T2.2. Na T2.2, o qa roda os 36 testes de banco num Postgres local e registra o resultado no cartão. Em paralelo, prepare a T2.12 (Postgres no CI) na branch equipe-claude/T2.12. Ela mexe em .github/, então mostre o diff para mim antes de abrir o PR.
```

🟨 **Você, em paralelo: T2.3.** Crie o projeto no Supabase, as credenciais do Google OAuth e o projeto na Vercel, e preencha as variáveis na Vercel e no `.env.local`. Nunca cole os valores numa sessão. Se tiver dúvida, pergunte ao tutor: "como faço a T2.3 do ROADMAP?".

---

## Etapa 6 — Login e lançamento manual (back-end)

🟦 **Claude** (depois do merge da T2.2 e da sua T2.3)

```
Escreva os cartões da T2.4 (login com Google e guarda OWNER_EMAIL) e da T2.6 (lançamento manual com assignIdentities). O cartão da T2.6 traz a seção "Contrato" com os tipos e as rotas que a tela da T2.7 vai usar. Abra o PR dos cartões. Depois do merge, delegue a T2.4 (equipe-claude/T2.4) e, em seguida, a T2.6 (equipe-claude/T2.6), cada uma com qa, os dois revisores e você.
```

---

## Etapa 7 — Tela de lançamento manual

🟦 **Claude** (depois do merge da T2.6)

```
Escreva o cartão da T2.7 para a equipe Gemini: o formulário e a lista de lançamento manual, usando só o contrato publicado na T2.6. Abra o PR do cartão.
```

🟩 **Gemini** (depois do merge do cartão)

```
Execute o cartão docs/tasks/E2/T2.7.md com o gemini-dev-frontend, na branch equipe-gemini/T2.7. Use só os tipos e as rotas do contrato da T2.6. A tela não calcula nenhuma regra financeira, só mostra o que o back-end devolve. Rode o gemini-qa, abra o PR e me diga o número.
```

---

## Etapa 8 — No ar (v0.2)

🟦 **Claude**

```
Delegue a T2.8 (testes de integração: índice único, duas inserções ao mesmo tempo, RLS com anon sem leitura, conta que não é a dona recusada) ao dev-backend, na branch equipe-claude/T2.8. Depois prepare comigo a T2.9 (deploy na Vercel e teste de fumaça) e, por fim, a T2.11 (gate E2 em docs/gates/E2.md e a tag v0.2).
```

🟨 **Você:** na T2.9, abra a URL da Vercel, entre com o seu Google, crie um lançamento e veja ele na lista. **É aqui que o app abre no navegador de verdade.**

---

## Etapa 9 — E1 parte B (regras de relatório, antes do E4)

🟦 **Claude**

```
Comece o E1 parte B, aproveitando a tag arquivo/zen-mayer-E1-E2 conforme a conclusão do debate: T1.5 (casos e ADR-0020, com a minha aprovação dos itens 6 e 22), depois T1.6 (com o default: never vindo de a25325d e a decisão sobre o BUG-T1.6-01), T1.7 (sem o a25325d) e T1.8. Um cartão e uma branch equipe-claude/T1.x por tarefa, com os dois revisores em cada uma.
```

---

## Daqui até a v1.0

Este arquivo cobre só até o próximo gate. **A cada gate fechado, o `cto` Claude escreve aqui as etapas do estágio seguinte**, no mesmo PR do gate (regra no `.claude/agents/cto.md`). O que vem depois, pela ADR-0023:

| Estágio | Equipe Claude | Equipe Gemini | Você |
| --- | --- | --- | --- |
| E1b Sondagem Pluggy | script de sondagem e relatório só de estrutura | — | conta Pluggy, autorizar os bancos, rodar o script |
| E3 Ingestão Pluggy (v0.3) | adapters, sincronização, mesclagem, conferência de lacunas | telas de contas e de sincronização | conferir os saldos contra o app do banco |
| E4 Painel e relatórios (v0.4) | serviços de relatório (sem cálculo na tela) | painel, gráficos e transações | conferir um mês fechado ao centavo |
| E5 Caju por prints (v0.5) | extração, `import_items` e conferência | telas de envio e de revisão dos prints | enviar os prints e revisar |
| E6 Fechamento (v1.0) | backup, segurança e acabamento do back-end | acabamento das telas | restaurar um backup num banco vazio |

## Rotina para manter as duas equipes no trilho

- **Ao começar o dia,** cole na sessão Claude: `Diga o estado do projeto: estágio, PRs abertos e o que cada um espera, e a próxima etapa do docs/equipes/prompts.md.`
- **Um PR por vez em cada equipe.** Só mande a próxima tarefa a uma equipe quando o PR anterior dela estiver mergeado ou esperando revisão.
- **Toda revisão vai como comentário no PR.** Se uma equipe disser "revisei" sem comentário no PR, a revisão não conta.
- **Sinais de que algo saiu do trilho:** branch fora do padrão `equipe-claude/…` ou `equipe-gemini/…`; um PR que mexe em pasta da outra equipe; QA sem os comandos executados; tarefa sem cartão. Nesses casos, cole na sessão Claude: `Confira o PR #<número> contra a ADR-0023 e me diga o que está fora da regra.`
- **Dúvida sua** vai para o tutor (`claude --agent tutor`), não para as equipes.

## Feito

| Data | Etapa | PR |
| --- | --- | --- |
| 19/11/2026 | divisão das equipes e `main` protegida (ADR-0023) | #23 |

## Prompts de revisão cruzada (use sempre que um PR ficar pronto)

**R1. PR da equipe Claude → revisão do Gemini.** 🟩 Gemini:

```
Revise o PR #<número> (branch equipe-claude/<tarefa>) como gemini-revisor, contra o cartão docs/tasks/<estágio>/<tarefa>.md e a spec. Leia o diff inteiro, confira os arquivos contra a área do cartão e procure, nesta ordem: regra financeira, segurança, concorrência, testes fracos e critério sem cobertura. Publique o parecer com gh pr comment: APROVADO ou ALTERAÇÕES, com os achados do mais grave ao menos grave.
```

**R2. PR da equipe Gemini → revisão do Claude.** 🟦 Claude:

```
Rode o revisor no PR #<número> (branch equipe-gemini/<tarefa>), contra o cartão docs/tasks/<estágio>/<tarefa>.md. Ele publica o parecer como comentário no PR. Depois faça a sua revisão final e me diga se posso fazer o merge.
```

**R3. Correção depois de um ALTERAÇÕES.** Na sessão da equipe autora:

```
O PR #<número> recebeu ALTERAÇÕES (leia o comentário no PR). Delegue as correções ao mesmo dev, na mesma branch, rode o QA de novo e me avise. Esta é a rodada <1 ou 2> de no máximo 2.
```
