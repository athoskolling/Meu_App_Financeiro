# Meu Financeiro — instruções para o agente

App pessoal e open source de controle financeiro (Santander e Nubank via MeuPluggy; Caju por prints). Spec completa em `docs/Meu_financeiro.md`; plano de execução em `ROADMAP.md`; roteiro do núcleo de domínio em `docs/Fase0_roteiro.md`; como os agentes trabalham em `docs/AGENTES.md`.

## Como trabalhamos

- O projeto usa uma equipe de agentes (`.claude/agents/`): **cto** (Opus), **dev-backend** e **dev-frontend** (Sonnet), **revisor** (Sonnet, esforço alto), **fixer** e **qa** (Haiku), mais o **tutor** (Haiku), que só explica ao dono. Só o CTO delega, e ele não chama o tutor. Ninguém trabalha sem um cartão de tarefa em `docs/tasks/`.
- **O dono (Athos) não escreve código.** Os agentes escrevem; o dono lê os diffs, pede alterações, aprova o merge e fecha o gate. Por isso os relatórios e explicações devem ser claros: ele precisa entender o que foi feito.
- **Cadeia de cada tarefa:** dev → `qa` → `revisor` (obrigatório em regra financeira, auth, banco, sincronização e segurança) → `cto` → dono.
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
