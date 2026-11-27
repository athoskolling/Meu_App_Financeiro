# 0030 — Gates renumerados por trilhas, na ordem real de execução

- **Status:** aceita pelo dono em 27/11/2026 (escolheu "renumerar por trilhas")
- **Atualiza:** a ordem e as tags do `docs/ROADMAP.md` e do `docs/equipes/GUIA_ATE_V1.md`; consolida a ordem da ADR-0028 (UI-First) nos gates
- **Não muda:** escopo, regras financeiras, segurança, ids das tarefas e pastas dos cartões

## Contexto

Os gates seguiam os estágios do plano original (E0 a E6, mais o E1b sem arquivo). Depois da ADR-0028, a equipe Gemini passou a construir as seis telas com prévia antes do back-end. Com isso:

- telas de estágios diferentes (T2.5b, T4.3a, T4.4a, T3.7a, T5.6a, T5.6b) já estavam prontas ou em andamento, mas os checklists delas estavam espalhados pelos gates E2, E3, E4 e E5;
- o gate E1 ficou com 0 de 26 itens marcados, mesmo com T1.1 a T1.3 mescladas;
- a ordem dos gates não batia mais com a ordem do trabalho.

O dono pediu os gates refeitos e em ordem, numerados por trilha.

## Decisão

1. **Dez gates, G0 a G9, na ordem de fechamento**, cada um com uma trilha (base, núcleo, visual, back-end, integração, fechamento):

   | Novo | Antes | Tag nova | Tag antiga |
   | --- | --- | --- | --- |
   | G0 Fundação | E0 | `v0.0` (já criada) | `v0.0` |
   | G1 Núcleo de domínio | E1 parte A | `v0.1` | `v0.1` |
   | G2 Telas com prévia | partes visuais de E2 a E5 (ADR-0028) | `v0.2` | — |
   | G3 Esqueleto do back-end | E2 (sem as telas) | `v0.3` | `v0.2` |
   | G4 Regras de relatório | E1 parte B | `v0.4` | `v0.1.1` |
   | G5 Sondagem Pluggy | E1b | sem tag | sem tag |
   | G6 Ingestão Pluggy | E3 | `v0.5` | `v0.3` |
   | G7 Painel e relatórios com dados reais | E4 | `v0.6` | `v0.4` |
   | G8 Caju por prints | E5 | `v0.7` | `v0.5` |
   | G9 Fechamento | E6 | `v1.0` | `v1.0` |

2. **Os gates fecham na ordem dos números.** O trabalho de gates vizinhos pode andar em paralelo (G3, G4 e G5; G6, G7 e G8), mas a tag sai na ordem, para as versões seguirem a sequência. O G5 não tem tag e fecha quando estiver pronto, antes do G6.
3. **Ids de tarefa e pastas de cartão continuam iguais.** `T2.5b` continua em `docs/tasks/E2/`, e cartões novos vão para a pasta do estágio de origem do id (T6.1 em `docs/tasks/E6/`). O job `limites` e as branches `equipe-*/T{id}` dependem desses nomes.
4. **Cada gate diz, no topo:** a trilha, as tarefas que cobre, o estado, de que gate depende e o que libera. O índice com a ordem e o diagrama fica em `docs/gates/README.md`.
5. **O gate E0 é registro fechado:** só o nome do arquivo e o título mudam; o texto continua citando os nomes antigos.

## Consequências

- O dono vê numa tabela só o que está fechado, o que está em andamento e o que vem depois.
- As datas da linha do tempo do `docs/ROADMAP.md` ficaram para trás (o E2 estava previsto para 19/11/2026). O `cto` reestima no fechamento do G1, com o ritmo real.
- ADRs, cartões e relatórios antigos continuam citando E0 a E6; a tabela da seção 1 é a tradução.
- Nenhuma tag precisa ser apagada: só a `v0.0` existe, e ela continua valendo para o G0.
