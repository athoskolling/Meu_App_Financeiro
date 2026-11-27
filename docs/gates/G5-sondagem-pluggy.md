# Gate G5 — Sondagem Pluggy (sem tag)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Antes: E1b, que não tinha arquivo de gate próprio.

- **Trilha:** integração (equipe Claude, `dev-backend` e `qa`, mais o dono com as credenciais).
- **Tarefas:** T1b.1 a T1b.6 (cartões em `docs/tasks/E1b/`).
- **Estado:** não começado. Por causa do trial da Pluggy, a T1b.1 (conta, MeuPluggy, autorizar os bancos) deve ser feita toda no mesmo dia.
- **Depende de:** G2 (pela ADR-0028, o trabalho funcional começa depois das telas); anda em paralelo com o G3 e o G4. **Libera:** G6.

Quem fecha: o dono. Quem confere antes: o `qa`, o `revisor` (segurança) e o CTO.

## Entregas

- [ ] Script descartável em `scripts/probe/` grava o JSON bruto só em `private/` (ignorado pelo Git) e nunca imprime o corpo.
- [ ] Relatório **só de estrutura** em `docs/probe-report.md`: campos, tipos, contagem de sinais por tipo de conta, status; sem valores, descrições nem ids.
- [ ] Fixtures fictícias em `tests/fixtures/pluggy/`, preservando estrutura, sinais e status, revisadas **pelo dono** antes do commit.
- [ ] Varredura das fixtures (CPF, número de conta, e-mail, ids reais) com PASS; gitleaks limpo.
- [ ] Cada item `[VERIFICAR]` da spec (8.5 e 5.9) respondido em `docs/decisoes/` ou marcado "não confirmável"; caixinhas confirmadas; spec atualizada.
- [ ] Nenhum agente leu `private/` nem `.env.local`.

## Para o dono explicar (sem olhar o código)

- [ ] Por que os dados reais nunca passam pelos agentes e o que eles recebem no lugar.
- [ ] Qual `[VERIFICAR]` mais mudou o desenho do mapper (G6) e por quê.

## Padrão (vale para todo gate)

- [ ] Todas as tarefas deste gate no `docs/ROADMAP.md` concluídas, cada uma com QA PASS, parecer do `revisor` e revisão do CTO.
- [ ] CI verde (typecheck, lint, testes, formatação, gitleaks, limites); nenhum dado real, JSON bruto, `itemId` ou credencial no repositório.
- [ ] Spec e ADRs em `docs/decisoes/` atualizados.
- [ ] Sem tag: o resultado entra na spec e libera o G6.
