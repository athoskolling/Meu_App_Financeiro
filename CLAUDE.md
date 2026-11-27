# Meu Financeiro — instruções para o agente

App pessoal e open source de controle financeiro (Santander e Nubank via MeuPluggy; Caju por prints). Spec completa em `docs/spec/Meu_financeiro.md`; plano de execução em `docs/ROADMAP.md`; roteiro do núcleo de domínio em `docs/spec/Fase0_roteiro.md`; como os agentes trabalham em `docs/equipes/AGENTES.md`; passo a passo até a v1.0 com as duas equipes em `docs/equipes/GUIA_ATE_V1.md`.

## Como trabalhamos

- O projeto usa uma equipe de agentes (`.claude/agents/`): **cto** (Opus), **dev-backend** e **dev-frontend** (Sonnet), **revisor** (Sonnet, esforço alto), **fixer** e **qa** (Haiku), mais o **tutor** (Haiku), que só explica ao dono. Só o CTO delega, e ele não chama o tutor. Ninguém trabalha sem um cartão de tarefa em `docs/tasks/`.
- **O dono (Athos) não escreve código.** Os agentes escrevem; o dono aprova cartões, lê os resumos, pode vetar um merge (rótulo `dono-segura`) e fecha o gate. Por isso os relatórios e explicações devem ser claros: ele precisa entender o que foi feito.
- **Duas equipes, divididas por área (ADR-0023), com modo unificado Gemini quando o Claude estiver pausado (ADR-0026).** Com as duas equipes ativas, a equipe Claude cuida de `domain/`, `lib/`, `drizzle/`, `app/api/` e `scripts/` (regra financeira, banco e auth) e a equipe Gemini (`GEMINI.md`, `.agents/agents/`) cuida de `app/` (fora de `app/api/`), `components/`, estilos e `README.md`. Enquanto o Claude estiver pausado para poupar cota, a equipe Gemini assume temporariamente ambas as áreas e o papel de CTO (ADR-0026), mantendo `.claude/` e `equipe-claude/` intactos para retomada imediata.
- **Branches com limites (ADR-0025):** `equipe-claude/T{id}` e `equipe-gemini/T{id}`, a partir de `origin/main`: o dev e o QA da equipe fazem commit nela, só na área da equipe, em `tests/qa/` e no próprio cartão. `cto/{assunto}` é do `cto`, só para o que não é código (docs, cartões, ADRs, gates, configs, dependências). Ninguém faz commit na `main`. O job `limites` do CI reprova branch fora do padrão ou arquivo fora da área.
- **Cadeia de cada tarefa:** dev → `qa` da mesma equipe → revisor da **outra** equipe (sempre) → revisor da mesma equipe (em regra financeira, auth, banco, sincronização e segurança) → `cto` faz o merge. O dev e o QA só fazem push; **o revisor cruzado abre o PR** (rascunho se pedir ALTERAÇÕES), o da mesma equipe comenta nele, e o `cto` faz o merge com CI verde e os pareceres APROVADO. PR de branch `cto/` ou `claude/` é o dono quem faz o merge.
- **Dúvidas do dono** vão para o `tutor` (`claude --agent tutor`), não para o fluxo de tarefas.
- Antes de qualquer coisa, confira em qual estágio estamos (tags do Git e `docs/gates/`). Não trabalhe em estágio cujo gate anterior não foi fechado.
- Mudança de escopo, de dependência ou de regra financeira vira ADR em `docs/decisoes/` antes do código.
- O dono se comunica em português do Brasil; responda assim.

## Regras do projeto

- Dinheiro é inteiro em centavos (`Cents`); `bigint` no banco. Nunca `float`.
- `amount` tem sinal: entrada positiva, saída negativa. Cada adapter converte a convenção da fonte.
- Datas são strings civis `YYYY-MM-DD`; fuso `America/Sao_Paulo`; a transação pertence ao mês da própria `date`.
- `domain/` é TypeScript puro: não importa `fs`, `fetch`, Drizzle, Next nem `node:*`. O lint barra.
- Identidade de transação: `baseKey` + ocorrência, com `existingCounts` e dois modos (`complete` e `incremental`); o id da Pluggy é só uma dica. Exclusão é lógica.
- Pagamento de fatura e movimento para caixinha (`investment`) nunca contam como gasto ou receita.
- Nada vai para `transactions` sem confirmação do usuário nos prints do Caju.
- A interface nunca calcula regra financeira; só exibe o que o back-end entrega.

## Segurança e privacidade

- Nunca no Git: credenciais, tokens, `itemId`, dados financeiros reais, prints, dumps, JSON bruto da Pluggy.
- Nenhum agente lê `.env*` com valores reais nem `private/`. Os agentes recebem apenas relatórios de **estrutura** e fixtures **sintéticas**.
- Fixtures são fictícias e ficam em `tests/fixtures/`.
- Logs sem valores, descrições, tokens ou dados pessoais.
- Banco: Drizzle só no servidor, RLS ligado sem políticas. Login só com Google e `OWNER_EMAIL`.
- Não fazer scraping bancário, não pedir senhas, não contornar autenticação. Respeitar os termos do MeuPluggy (uso pessoal, até 5 conexões).

## Antes de integrar algo externo

Não inventar APIs. Conferir a documentação oficial e marcar o que não foi verificado como **[VERIFICAR]**. Em desenvolvimento, usar mocks.

## Antes de dizer "pronto"

Rode `pnpm typecheck && pnpm lint && pnpm test` e relate os comandos e o resultado. Sem comando executado, não há "pronto".
