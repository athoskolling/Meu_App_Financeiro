# 0019: Base do app no E2 (dependências, tsconfig de `domain/`, variáveis e log)

- **Status:** aceita. Proposta pelo CTO e aprovada pelo dono em 15/10/2026 (ok explícito para as dependências).
- **Estágio:** E2 (T2.1)
- **Emenda:** ADR-0017, emenda 1 (`domain/` só tem `.ts`), passa a aceitar também o caminho exato `domain/tsconfig.json`.

## Decisões

1. **Dependências novas aprovadas:** `next`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `zod`, `@types/react` e `@types/react-dom`. As versões exatas ficam no relatório da T2.1 e no lockfile. Qualquer outra dependência continua exigindo ok do dono.
2. **`domain/` tem tsconfig próprio**, sem `DOM` e sem `types: ["node"]`, e o `pnpm typecheck` roda os dois. O Next exige `lib: ["DOM"]` na raiz, e sem isso `document`, `localStorage` e `Buffer` passariam a existir dentro de `domain/` sem erro. Fecha o risco "globais de outros ambientes" do gate E0 para o navegador e o Node (`Deno` e `Bun` continuam como risco aceito).
3. **Variáveis obrigatórias por etapa.** O schema Zod tem as 8 variáveis da spec 14, mas só `DATABASE_URL` e `OWNER_EMAIL` são obrigatórias na T2.1. Cada uma das outras vira obrigatória no cartão que a usa. Assim `pnpm dev` funciona antes de o dono criar o Supabase (T2.3), e o app continua falhando na partida quando falta algo que ele realmente usa. Mensagens de erro citam o nome da variável, nunca o valor.
4. **Log por lista de permitidos.** O helper de log só aceita chaves conhecidas (ids, contagens, durações, códigos), e de um erro registra só o nome e o código. Isso transforma a regra "logs sem valores nem descrições" (spec 14) em algo testável, em vez de depender de cuidado.
5. **Postgres local em Docker** (`postgres:17`, porta presa a `127.0.0.1`), com credenciais de desenvolvimento por variável com padrão. É a base dos testes de integração da T2.8.

## Consequências

- Os cartões T2.2, T2.4 e do E3 precisam dizer quais variáveis passam a obrigatórias.
- Acrescentar `pnpm build` ao CI fica para um cartão próprio (mudança nas travas, com revisor).
