# Gate G8 — Caju por prints (v0.7)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: gate E5.

- **Trilha:** integração (equipe Claude; a T5.6 liga as telas Enviar e Revisar, da equipe Gemini, ao fluxo real).
- **Tarefas:** T5.0 a T5.9 (cartões em `docs/tasks/E5/`; a parte visual, T5.6a e T5.6b, fecha no G2).
- **Estado:** não começado (a T5.0, um print do Caju por semana, é do dono e deve começar já).
- **Depende de:** G3 e G1. Anda em paralelo com o G6 e o G7. **Libera:** G9.

> **Rascunho do pacote inicial.** O CTO relê e refina este checklist no início do estágio, com o que foi aprendido nos estágios anteriores, e o dono aprova. Regras gerais de gate: `docs/spec/Meu_financeiro.md`, seção 17.

Quem fecha: o dono. Quem confere antes: o QA, o `revisor` e o CTO (diff contra este checklist).

## Entregas

- [ ] Decisões Q14 (motor de extração) e Q16 (recorte e compressão) registradas em ADR, com a política de retenção do provedor verificada.
- [ ] **Taxa de erro medida** em pelo menos 4 semanas de prints reais (um por semana), com relatório por extrator.
- [ ] Parser de linhas e mesclador: os casos do CTO e os 10 casos do roteiro passam; âncora mínima e tratamento de ambiguidade documentados.
- [ ] **Nada vai para `transactions` sem confirmação do usuário** na tela Revisar.
- [ ] A conferência de saldo funciona: saldo que não fecha bloqueia a confirmação.
- [ ] **Reimportar o mesmo print não duplica**; prints sobrepostos não duplicam; linhas idênticas legítimas dentro e entre prints são preservadas.
- [ ] Só as linhas extraídas e um hash são guardados; a imagem não é armazenada.
- [ ] Telas Enviar (celular) e Revisar, aprovadas no G2, ligadas ao fluxo real; um print por requisição, abaixo de 4,5 MB.
- [ ] Nenhum print, texto bruto de print nem dado real no Git ou nos logs.

## Para o dono explicar (sem olhar o código)

- [ ] Por que a revisão humana é obrigatória antes de gravar.
- [ ] Por que o índice de ocorrência sozinho não resolve prints sobrepostos e o que a âncora faz.
- [ ] O que a conferência de saldo garante e o que não garante.

## Padrão (vale para todo gate)

- [ ] Todas as tarefas deste gate no `docs/ROADMAP.md` concluídas, cada uma com QA PASS, parecer do `revisor` (quando obrigatório) e revisão do CTO.
- [ ] CI verde (typecheck, lint, testes, gitleaks); nenhum dado real, print ou dump no repositório.
- [ ] Spec e ADRs em `docs/decisoes/` atualizados.
- [ ] `CHANGELOG` com a entrada v0.7 e tag `v0.7` no Git.
- [ ] Retro curta (o que funcionou no esquema de agentes, o que mudar) e reestimativa do prazo pelo CTO.
