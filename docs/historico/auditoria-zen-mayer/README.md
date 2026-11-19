# Auditoria da branch zen-mayer (19/11/2026)

A branch `claude/zen-mayer-trcp1r` (depois `pendente/zen-mayer-E1-E2`) trouxe 63 commits feitos numa sessão de nuvem, sem PR e sem aprovação do dono: T1.3, T1.5 a T1.8, T2.1s, T2.2, T2.5 e T2.10. As equipes Claude e Google auditaram essa branch, cada uma por conta própria. Depois, a equipe Claude comparou as duas auditorias. O roteiro está em `docs/historico/delegacao/2026-11-19-gemini.md`.

**Comece pelo `debate.md`:** ele tem a comparação, o placar e a conclusão, com o veredito de cada tarefa.

| Pasta | O que tem |
| --- | --- |
| `claude/` | G1 a G4 da equipe Claude (PRONTO `4d175f2`) e o adendo (`5ece678`: banco real, gitleaks e o fim do fast-forward) |
| `gemini/` | G1 a G4 da equipe Google (PRONTO `2f2c1c6`) |
| `debate.md` | o parecer cruzado e a conclusão |

Os relatórios citam caminhos como `docs/historico/auditoria-zen-mayer/zen-mayer-G1-inventario.md`, que eram os caminhos nas branches de cada equipe. Aqui eles estão nas subpastas.

## Onde está o código e o histórico

As branches foram apagadas em 19/11/2026. Nada se perdeu, porque cada uma virou uma tag:

| Tag | Conteúdo |
| --- | --- |
| `arquivo/zen-mayer-E1-E2` | a linha zen-mayer inteira (`fb6bf2a`). **Fonte do código a reaproveitar** |
| `arquivo/auditoria-claude`, `arquivo/auditoria-gemini`, `arquivo/auditoria-debate` | o histórico de commits de cada auditoria |
| `arquivo/E1-T1.3-cartao` | o commit original do cartão da T1.3 (o cartão já está em `main`) |

Para aproveitar uma tarefa, crie uma branch a partir de `main` e copie dela só os arquivos daquela tarefa. Por exemplo:

```
git switch -c agent/T1.3-backend origin/main
git checkout arquivo/zen-mayer-E1-E2 -- domain/transactions/identity.ts domain/transactions/index.ts
```

Depois, a branch segue a cadeia completa (dev, qa, revisor, cto e dono).
