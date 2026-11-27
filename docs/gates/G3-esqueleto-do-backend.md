# Gate G3 — Esqueleto do back-end (v0.3)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: gate E2, sem as telas, que foram para o G2.

- **Trilha:** back-end (equipe Claude; a T2.7 e a T2.10a são da equipe Gemini).
- **Tarefas:** T2.1, T2.2, T2.3, T2.4, T2.6, T2.7, T2.8, T2.9, T2.10a, T2.10b e T2.11 (cartões em `docs/tasks/E2/`).
- **Estado:** em andamento. Já mesclada: T2.1 (#15; falta o QA da T2.2 verificar o Docker). Cartões da T2.2 e da T2.10a em PR (#103 e #104).
- **Depende de:** G1 e G2. **Libera:** G6 e G8.

> **Rascunho do pacote inicial.** O CTO relê e refina este checklist no início do estágio, com o que foi aprendido nos estágios anteriores, e o dono aprova. Regras gerais de gate: `docs/spec/Meu_financeiro.md`, seção 17.

Quem fecha: o dono. Quem confere antes: o QA, o `revisor` e o CTO (diff contra este checklist).

## Entregas

- [ ] Uma conta Google que não é a do dono é **recusada** em toda rota.
- [ ] A chave anônima (`anon`) do Supabase **não lê nada**: RLS ligado, sem políticas, e há um teste que prova.
- [ ] A migração roda **do zero** em um banco vazio (local, em Docker) e em produção, pelo pooler na porta 5432.
- [ ] Variável de ambiente obrigatória ausente faz o app falhar na partida (validação com Zod).
- [ ] O índice único `(account_id, identity_key)` existe; duas inserções concorrentes da mesma transação resultam em uma linha (teste de integração).
- [ ] Lançamento manual funciona ponta a ponta; reenviar o mesmo lançamento não duplica.
- [ ] Deploy na Vercel no ar; login e lançamento manual funcionam em produção.
- [ ] A tela Entrar (feita no G2) chama o login real, e as telas internas mostram o lançamento manual com dados do banco, não da prévia.
- [ ] Logs não contêm valores, descrições nem dados pessoais.
- [ ] README de instalação e `.env.example` sincronizados.

## Para o dono explicar (sem olhar o código)

- [ ] Por que o RLS fica ligado sem nenhuma política e o app acessa o banco só pelo servidor.
- [ ] Por que a conexão do app usa a porta 6543 com `prepare: false` e a migração usa a 5432.
- [ ] O que impede alguém com a URL do app de ver os seus dados.

## Padrão (vale para todo gate)

- [ ] Todas as tarefas deste gate no `docs/ROADMAP.md` concluídas, cada uma com QA PASS, parecer do `revisor` (quando obrigatório) e revisão do CTO.
- [ ] CI verde (typecheck, lint, testes, gitleaks); nenhum dado real, print ou dump no repositório.
- [ ] Spec e ADRs em `docs/decisoes/` atualizados.
- [ ] `CHANGELOG` com a entrada v0.3 e tag `v0.3` no Git.
- [ ] Retro curta (o que funcionou no esquema de agentes, o que mudar) e reestimativa do prazo pelo CTO.
