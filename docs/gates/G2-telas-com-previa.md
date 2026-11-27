# Gate G2 — Telas com prévia (v0.2)

> Numeração por trilhas (ADR-0030). Índice e ordem: `docs/gates/README.md`. Gate novo: junta a parte visual que estava espalhada pelos gates E2, E3, E4 e E5 (estratégia UI-First, ADR-0028).

- **Trilha:** visual (equipe Gemini, `gemini-dev-frontend` e `gemini-qa`).
- **Tarefas:** T2.5, T2.5b, T4.3a, T4.4a, T3.7a, T5.6a e T5.6b (cartões em `docs/tasks/E2/`, `E3/`, `E4/` e `E5/`).
- **Estado:** em andamento. Já mescladas: T2.5 (#30), T2.5b (#114) e T4.3a (#115). Faltam T4.4a, T3.7a, T5.6a e T5.6b.
- **Depende de:** G0. **Libera:** G3, G4 e G5 (pela ADR-0028, o back-end funcional começa depois da aprovação visual da T5.6b).

Quem fecha: o dono. Quem confere antes: o `gemini-qa` (screenshots), o revisor da outra equipe e o CTO.

## Entregas

- [ ] ADR-0028 aprovada pelo dono (hoje está como "proposta", embora os cartões já tenham sido executados).
- [ ] As seis telas (Entrar, Painel, Transações, Contas, Enviar print e Revisar print) conferem com `docs/design/*.dc.html` em `1280px` e em `360px`, com screenshots do QA anexados a cada cartão.
- [ ] Toda tela com dados fictícios mostra a `FaixaPrevia` ("Prévia visual — dados fictícios").
- [ ] Os componentes só recebem ViewModel pronto (`components/contratos/ui.ts`): nenhum cálculo financeiro, nenhuma soma de centavos no JSX e nenhum import de `domain/`, `lib/` ou `@supabase/*` (o revisor confirma na leitura do diff).
- [ ] Nenhuma cor hexadecimal solta no JSX: só os tokens de `@theme` em `app/globals.css`.
- [ ] Os estados de demonstração (filtros de Transações, os 4 estados de Revisar print) funcionam por `searchParams`, sem regra financeira no navegador.
- [ ] Navegação: barra inferior no celular (`< 640px`) e cabeçalho completo no desktop.
- [ ] Os dados da prévia são 100% fictícios (os mesmos cenários de `docs/design/`).

## Para o dono explicar (sem olhar o código)

- [ ] Por que a tela nunca calcula regra financeira, mesmo na prévia.
- [ ] O que muda quando o back-end chegar: só a fonte de dados das páginas, de `components/previa/` para o servidor; os componentes aprovados aqui não são reescritos.

## Padrão (vale para todo gate)

- [ ] Todas as tarefas deste gate no `docs/ROADMAP.md` concluídas, cada uma com QA PASS, parecer do revisor cruzado e revisão do CTO.
- [ ] CI verde (typecheck, lint, testes, formatação, gitleaks, limites); nenhum dado real, print ou dump no repositório.
- [ ] Spec e ADRs em `docs/decisoes/` atualizados.
- [ ] `CHANGELOG` com a entrada v0.2 e tag `v0.2` no Git.
- [ ] Retro curta (o que funcionou no esquema de agentes, o que mudar) e reestimativa do prazo pelo CTO.
