# Gate G4 — Regras de relatório (v0.4)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: gate E1, parte B (tag `v0.1.1`).

- **Trilha:** núcleo (equipe Claude, `dev-backend`).
- **Tarefas:** T1.5, T1.6, T1.7, T1.8, T1.9, T1.9r e T1.10 (cartões em `docs/tasks/E1/`).
- **Estado:** não começado.
- **Depende de:** G1. **Libera:** G7.

Quem fecha: o dono. Quem confere antes: o QA, o `revisor` e o CTO.

Pode andar em paralelo com o G3. Precisa fechar antes do G7, porque a T4.1 usa `spendingForPeriod`.

## Entregas

- [ ] **Gastos do período:** uma única função `spendingForPeriod`; casos de cartão, caixinha (`investment`), parcelas e `pending` passam.
- [ ] **Transferências:** os casos passam e o critério de desempate está testado e documentado.
- [ ] **Categorizador:** a ordem de prioridade e a regra de especificidade estão testadas.
- [ ] Os casos de teste foram escritos pelo CTO e aprovados pelo dono **antes** da implementação (confira no histórico do Git).
- [ ] QA verificou as três (propriedade e bordas) e o `revisor` deu APROVADO, com o parecer anexado.
- [ ] O dono leu o diff de cada tarefa e o parecer do CTO.

## Para o dono explicar

- [ ] Por que o pagamento de fatura não é despesa e o movimento para caixinha também não.
- [ ] Qual regra decide o mês de uma compra parcelada e de uma compra `pending`.

## Qualidade e encerramento

- [ ] CI verde; lint de isolamento do `domain/` continua barrando.
- [ ] `CHANGELOG` com a entrada v0.4 e tag `v0.4`.
- [ ] Retro curta (o que funcionou no esquema de agentes, o que não).
