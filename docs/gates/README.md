# Gates: a ordem até a v1.0

Cada gate é um checklist que o `cto` preenche com evidências e que **só o dono fecha**. Os gates fecham na ordem dos números (ADR-0030); o trabalho de gates vizinhos pode andar em paralelo, mas a tag sai na ordem.

| Gate | Trilha | O que entrega | Antes | Tag | Estado |
| --- | --- | --- | --- | --- | --- |
| [G0](G0-fundacao.md) | base | repositório, CI, lint de isolamento, proteções do GitHub | E0 | `v0.0` | **fechado** em 15/10/2026 |
| [G1](G1-nucleo-de-dominio.md) | núcleo | Money, NormalizedTransaction, identidade e dedup | E1 parte A | `v0.1` | em conferência (tarefas mescladas) |
| [G2](G2-telas-com-previa.md) | visual | as 6 telas com ViewModel e dados fictícios (ADR-0028) | partes visuais de E2 a E5 | `v0.2` | em andamento (3 de 7 tarefas) |
| [G3](G3-esqueleto-do-backend.md) | back-end | banco, RLS, auth, lançamento manual, deploy | E2 | `v0.3` | em andamento (T2.1) |
| [G4](G4-regras-de-relatorio.md) | núcleo | gastos do período, transferências, categorizador | E1 parte B | `v0.4` | não começado |
| [G5](G5-sondagem-pluggy.md) | integração | formato real da Pluggy, fixtures sintéticas, `[VERIFICAR]` | E1b | — | não começado |
| [G6](G6-ingestao-pluggy.md) | integração | sincronização com Santander e Nubank | E3 | `v0.5` | não começado |
| [G7](G7-painel-e-relatorios.md) | back-end | painel, transações e contas com dados reais | E4 | `v0.6` | não começado |
| [G8](G8-caju-por-prints.md) | integração | importação do Caju por prints, com revisão humana | E5 | `v0.7` | não começado |
| [G9](G9-fechamento.md) | fechamento | exportação, backup, README, critérios do MVP | E6 | `v1.0` | não começado |

## Dependências

```
G0 ─► G1 ─► G2 ─┬─► G3 ─┬────────► G6 ──► G7 ──► G9
                │       │          ▲      ▲      ▲
                ├─► G4 ─┼──────────┼──────┘      │
                │       │          │             │
                └─► G5 ─┼──────────┘             │
                        └─► G8 ──────────────────┘
```

- G2 vem antes do back-end porque o dono decidiu validar todas as telas primeiro (ADR-0028).
- G3, G4 e G5 podem andar juntos depois do G2.
- G6 precisa do G1 (identidade), do G3 (banco e auth) e do G5 (formato real da Pluggy).
- G7 precisa do G6 e do G4 (`spendingForPeriod`).
- G8 precisa do G3 e do G1; não espera o G6 nem o G7.
- A T5.0 (um print do Caju por semana, fora do Git) é do dono e começa **já**, porque o G8 mede o erro sobre pelo menos 4 semanas.

## Tarefas e cartões

Os ids das tarefas **não mudaram** (T1.3, T2.5b, T4.3a…), nem as pastas dos cartões (`docs/tasks/E1/`, `E2/`…), porque o CI de limites e as branches usam esses nomes. Cada gate diz quais tarefas cobre. A tabela completa de tarefas está no `docs/ROADMAP.md`.

## Como fechar um gate

1. Peça ao `cto`: _"Prepare o gate G{n}."_ Ele preenche `docs/gates/G{n}-*.md` com a evidência de cada item (PR, teste, comando).
2. Responda às perguntas de explicação **com as suas palavras** (o `tutor` ajuda a estudar).
3. Faça os itens que só você confere (saldos, mês fechado, restauração do dump) e anote o resultado **sem valores reais**.
4. Marque o gate como fechado, faça o merge do PR do gate (branch `cto/`) e crie a tag da tabela (`git tag v0.{n}` e `git push --tags`).
