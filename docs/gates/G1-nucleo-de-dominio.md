# Gate G1 — Núcleo de domínio (v0.1)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: gate E1, parte A.

- **Trilha:** núcleo (equipe Claude, `dev-backend`).
- **Tarefas:** T1.0, T1.0a, T1.1 (com T1.1b e T1.1c), T1.2, T1.3, T1.4, T1.4r e T1.4g (cartões em `docs/tasks/E1/`).
- **Estado:** em conferência. Já mescladas: T1.0a (#13), T1.1 (#12, #16, #17), T1.2 (#18) e T1.3 (#113). Falta o `cto` preencher a evidência de cada item e o dono responder às perguntas.
- **Libera:** G3 (a T2.6 usa `assignIdentities`), G4 e G6.

Quem fecha: o dono. Quem confere antes: o QA, o `revisor` e o CTO. O código é escrito por agentes (`dev-backend`); o dono lê os diffs e pede alterações.

## Entregas

- [ ] **Money:** todos os casos da tabela passam, incluindo `fromDb` e fora da faixa segura. Decisão do tipo registrada.
- [ ] **NormalizedTransaction:** `validateTransaction` devolve todos os problemas, não só o primeiro. Decisão sobre `date` como string civil registrada.
- [ ] **Identidade e dedup:** `assignIdentities` recebe `existingCounts`, modo `complete` e `incremental`, hash injetado. Casos de reimportação integral, período sobreposto e lote incremental passam. Explicação dos dois modos registrada.

## Para o dono explicar (sem olhar o código)

- [ ] Por que dinheiro é inteiro em centavos e o que muda na borda com o banco.
- [ ] Por que existem dois modos em `assignIdentities`.
- [ ] Por que o índice único no banco será a garantia final da dedup (G3).

(Dúvida de conceito? Pergunte ao `tutor`. Ele ensina; a explicação final tem de ser sua.)

## Encerramento

- [ ] Os casos de teste foram escritos pelo CTO e aprovados pelo dono **antes** da implementação (confira no histórico do Git).
- [ ] QA atacou as três tarefas em `tests/qa/` (testes de propriedade e casos extras) e o relatório está no gate.
- [ ] `revisor` deu APROVADO (ou os achados foram corrigidos) e o parecer está anexado.
- [ ] O dono leu o diff de cada tarefa.
- [ ] CI verde (typecheck, lint, testes, gitleaks); nada em `src/domain/` importa I/O; nenhum `float` em dinheiro.
- [ ] Todos os testes têm nome que descreve a regra, não a implementação.
- [ ] `CHANGELOG` com a entrada v0.1 e tag `v0.1`.
- [ ] Decisões novas em `docs/decisoes/`.
