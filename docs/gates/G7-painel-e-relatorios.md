# Gate G7 — Painel e relatórios com dados reais (v0.6)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: gate E4.

- **Trilha:** back-end (equipe Claude) ligando as telas do G2 (equipe Gemini) aos dados reais.
- **Tarefas:** T4.1, T4.2, T4.3, T4.4, T4.5a, T4.5b, T4.6, T4.7 e T4.8 (cartões em `docs/tasks/E4/`; a parte visual, T4.3a e T4.4a, fechou no G2).
- **Estado:** não começado.
- **Depende de:** G4 e G6. **Libera:** G9.

> **Rascunho do pacote inicial.** O CTO relê e refina este checklist no início do estágio, com o que foi aprendido nos estágios anteriores, e o dono aprova. Regras gerais de gate: `docs/spec/Meu_financeiro.md`, seção 17.

Quem fecha: o dono. Quem confere antes: o QA, o `revisor` e o CTO (diff contra este checklist).

## Entregas

- [ ] **Um mês fechado bate com o app do banco ao centavo** (conferido por você).
- [ ] Transferência para caixinha e pagamento de fatura **não** contam como gasto nem como receita.
- [ ] Todos os números do painel vêm de `spendingForPeriod`; a interface não calcula regra financeira (o revisor confirma na leitura do diff).
- [ ] Painel, Transações (filtros, busca, recategorização) e Contas mostram os dados reais no lugar da prévia, sem mudar os componentes aprovados no G2, em desktop e celular.
- [ ] Categorização integrada; `merchant_rules` com as opções "apenas esta" e "sempre este estabelecimento".
- [ ] Testes de componentes e da camada de consulta passam; checklist manual de acessibilidade feito.
- [ ] Escopo do v1.0 respeitado: resumo do mês, categorias, cartão e patrimônio (o resto é v1.x).

## Para o dono explicar (sem olhar o código)

- [ ] Por que a interface nunca calcula regra financeira.
- [ ] Como o app decide a que mês pertence uma compra parcelada e uma compra `pending`.
- [ ] De onde vem o número do patrimônio (contas mais holdings).

## Padrão (vale para todo gate)

- [ ] Todas as tarefas deste gate no `docs/ROADMAP.md` concluídas, cada uma com QA PASS, parecer do `revisor` (quando obrigatório) e revisão do CTO.
- [ ] CI verde (typecheck, lint, testes, gitleaks); nenhum dado real, print ou dump no repositório.
- [ ] Spec e ADRs em `docs/decisoes/` atualizados.
- [ ] `CHANGELOG` com a entrada v0.6 e tag `v0.6` no Git.
- [ ] Retro curta (o que funcionou no esquema de agentes, o que mudar) e reestimativa do prazo pelo CTO.
