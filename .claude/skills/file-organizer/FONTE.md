# Origem da skill `file-organizer`

- Fonte: https://github.com/JOHNadonis/claude-code-skills/tree/main/skills/file-organizer
- Commit de origem: `4ac29a24db9fc8bba16c61b1cdaa3f5058934247` (baixado em 27/11/2026)
- Arquivo copiado sem alteração: `SKILL.md`.
- Licença: o repositório de origem é uma coleção pessoal exportada e **não declara licença**, nem o autor original da skill. **[VERIFICAR]** a licença antes de qualquer redistribuição além deste repositório.
- Cópia idêntica em `.agents/skills/file-organizer/` para a equipe Gemini. O teste `tests/ci/skills-espelho.test.ts` reprova se as duas cópias divergirem.

## Limites neste projeto

- A skill foi escrita para pastas pessoais (Downloads, fotos). Neste repositório, mover código segue a ADR-0029 e as áreas das equipes (ADR-0023), com cartão ou branch `estrutura/{slug}`; ela não autoriza mover nada por conta própria.
- Nunca apagar arquivo sem confirmação do dono (a própria skill pede isso).
- Os comandos de exemplo citam `md5` (macOS); no Linux o equivalente é `md5sum`.
