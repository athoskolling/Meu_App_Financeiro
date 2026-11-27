# Gate G6 — Ingestão Pluggy (v0.5)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: gate E3.

- **Trilha:** integração (equipe Claude; a T3.7 liga a tela Contas, da equipe Gemini, aos dados reais).
- **Tarefas:** T3.1 a T3.10 (cartões em `docs/tasks/E3/`; a parte visual, T3.7a, fechou no G2).
- **Estado:** não começado.
- **Depende de:** G1, G3 e G5. **Libera:** G7.

> **Rascunho do pacote inicial.** O CTO relê e refina este checklist no início do estágio, com o que foi aprendido nos estágios anteriores, e o dono aprova. Regras gerais de gate: `docs/spec/Meu_financeiro.md`, seção 17.

Quem fecha: o dono. Quem confere antes: o QA, o `revisor` e o CTO (diff contra este checklist).

## Entregas

- [ ] Decisão Q15 (sincronização) registrada em ADR e na spec 8.6.
- [ ] Itens `[VERIFICAR]` da sondagem (G5) respondidos e refletidos no mapper.
- [ ] **Sincronizar duas vezes não duplica** (teste automatizado e primeira sincronização real).
- [ ] Sincronizações concorrentes são barradas pelo lock em `sync_logs` e, no limite, pelo índice único.
- [ ] A primeira carga traz 12 meses; as seguintes usam janela de cerca de 7 dias.
- [ ] Sinal do cartão invertido corretamente pelo mapper; transferência para caixinha chega como `investment`.
- [ ] Saldo fecha com o app do banco, **ou** a conta fica marcada como incompleta (`reconciliation_status` e `reconciliation_diff`).
- [ ] Conexão expirada mostra "Reconectar"; reconectar não duplica.
- [ ] Rota do cron protegida por `CRON_SECRET`; o botão "Sincronizar agora" usa o mesmo serviço.
- [ ] Holdings (caixinhas) aparecem na tela Contas.
- [ ] Conferência manual dos saldos de Santander e Nubank contra os apps dos bancos.
- [ ] Nenhum JSON bruto da Pluggy, `itemId` ou credencial no Git ou nos logs.

## Para o dono explicar (sem olhar o código)

- [ ] Por que o id da transação da Pluggy é só uma dica e a identidade vem de `baseKey` + ocorrência.
- [ ] Por que os dados do cartão chegam com o sinal invertido e onde isso é corrigido.
- [ ] O que significa uma conta marcada como incompleta e por que isso é melhor que um saldo errado.

## Padrão (vale para todo gate)

- [ ] Todas as tarefas deste gate no `docs/ROADMAP.md` concluídas, cada uma com QA PASS, parecer do `revisor` (quando obrigatório) e revisão do CTO.
- [ ] CI verde (typecheck, lint, testes, gitleaks); nenhum dado real, print ou dump no repositório.
- [ ] Spec e ADRs em `docs/decisoes/` atualizados.
- [ ] `CHANGELOG` com a entrada v0.5 e tag `v0.5` no Git.
- [ ] Retro curta (o que funcionou no esquema de agentes, o que mudar) e reestimativa do prazo pelo CTO.
