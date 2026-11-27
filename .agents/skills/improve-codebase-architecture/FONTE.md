# Origem da skill `improve-codebase-architecture`

- Fonte: https://github.com/JOHNadonis/claude-code-skills/tree/main/skills/improve-codebase-architecture
- Commit de origem: `4ac29a24db9fc8bba16c61b1cdaa3f5058934247` (baixado em 27/11/2026)
- Arquivos copiados sem alteração: `SKILL.md`, `DEEPENING.md`, `INTERFACE-DESIGN.md`, `LANGUAGE.md`.
- Licença: o repositório de origem é uma coleção pessoal exportada e **não declara licença**, nem o autor original da skill. **[VERIFICAR]** a licença antes de qualquer redistribuição além deste repositório.
- Cópia idêntica em `.agents/skills/improve-codebase-architecture/` para a equipe Gemini (Antigravity lê skills de `.agents/skills/`). O teste `tests/ci/skills-espelho.test.ts` reprova se as duas cópias divergirem.

## Como usar

- Claude Code: `/improve-codebase-architecture`, ou peça "procure oportunidades de melhorar a arquitetura".
- Gemini (Antigravity): a skill aparece sozinha quando o pedido combina com a descrição.

## Adaptação a este projeto

- A skill fala em `docs/adr/` e `CONTEXT.md`. Aqui as decisões ficam em `docs/decisoes/` e o vocabulário do domínio está na spec (`docs/spec/Meu_financeiro.md`).
- Ela aponta para `../grill-with-docs/CONTEXT-FORMAT.md` e `../grill-with-docs/ADR-FORMAT.md`, que **não** foram instalados. Para o formato de ADR, siga as ADRs existentes em `docs/decisoes/`.
- A estrutura de pastas em camadas é a da ADR-0029. Uma proposta da skill que contrarie uma ADR aceita precisa de ADR nova antes do código.
