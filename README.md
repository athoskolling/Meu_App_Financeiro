# Meu Financeiro

Aplicativo pessoal e open source de controle financeiro, para reunir as contas do dono em um só lugar. Hoje o repositório tem a base do projeto e o núcleo de domínio (valores em centavos e regras de transação, em `domain/`). A tela inicial ainda é provisória. A integração com bancos e o painel ainda não existem.

A especificação completa está em `docs/Meu_financeiro.md`.

## Requisitos

- Node.js 24 (ver `.nvmrc` e o campo `engines` do `package.json`).
- pnpm 12.11.2, pelo Corepack, que já vem com o Node 24.
- Docker, opcional. Só é preciso para o Postgres local.

## Instalação

Ative o Corepack, que instala o pnpm na versão certa:

```bash
corepack enable
```

Instale as dependências:

```bash
pnpm install
```

## Variáveis de ambiente

Copie o modelo para o arquivo local:

```bash
cp .env.example .env.local
```

Depois preencha o `.env.local`. Nunca commite esse arquivo.

Hoje são obrigatórias estas duas variáveis:

- `DATABASE_URL`: conexão com o Postgres. Com o banco local, o formato é `postgres://postgres:<senha>@127.0.0.1:5432/meu_financeiro`. Use a senha definida em `POSTGRES_PASSWORD` (sem ela, vale o padrão do `docker-compose.yml`, que só existe nesta máquina).
- `OWNER_EMAIL`: seu e-mail do Google. Outras contas são recusadas. Substitua o texto pelo seu e-mail.

As outras variáveis do `.env.example` são opcionais por enquanto: `DATABASE_URL_MIGRATIONS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CRON_SECRET`, `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`. Cada uma vira obrigatória no cartão que passar a usá-la. Se você preencher alguma, o app já valida o formato.

Se faltar uma variável obrigatória, `pnpm dev` para na partida e diz o nome da variável. Ele nunca mostra o valor.

## Postgres local

O `docker-compose.yml` sobe um Postgres 17 que só aceita conexões da própria máquina (`127.0.0.1`). Ele não se conecta ao banco do Supabase.

```bash
docker compose up -d postgres
```

## Comandos

Sobe o app em modo de desenvolvimento, em `http://localhost:3000`:

```bash
pnpm dev
```

Gera a versão de produção:

```bash
pnpm build
```

Verifica os tipos do app e do `domain/`:

```bash
pnpm typecheck
```

Roda o ESLint. Qualquer aviso reprova:

```bash
pnpm lint
```

Roda os testes com Vitest:

```bash
pnpm test
```

Confere a formatação com Prettier, sem alterar arquivos:

```bash
pnpm format:check
```

## Estrutura de pastas

- `domain/`: regras de negócio em TypeScript puro, sem banco, rede ou Next.js.
- `lib/`: código compartilhado de infraestrutura, como variáveis de ambiente e log.
- `app/`: rotas e telas do Next.js.
- `tests/`: testes automatizados e fixtures sintéticas.
- `docs/`: especificação, decisões (ADRs), gates e cartões de tarefa.

## Privacidade

- Nunca commite `.env*` (exceto `.env.example`), `private/`, prints, extratos, planilhas, dumps ou JSON bruto da Pluggy.
- Não coloque segredos, tokens, `itemId` nem dados financeiros reais em issues, PRs, testes ou logs.
- As fixtures de teste são sintéticas e ficam em `tests/fixtures/`.
- O acesso previsto é só com Google, e só para o e-mail do dono (`OWNER_EMAIL`).

## Como o projeto é desenvolvido

O código é escrito por agentes de IA, e o dono revisa e aprova cada mudança. Para entender a equipe e o fluxo de tarefas, veja `docs/AGENTES.md`. O plano de execução, com as etapas e o que está pronto em cada uma, está em `ROADMAP.md`.

## Licença

A definir (E6).
