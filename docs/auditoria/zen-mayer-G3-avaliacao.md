# G3: avaliação por tarefa e plano de PRs (equipe Claude)

**Base:** o G1 (inventário), o G2 (travas) e o G4 (T1.3), além da leitura dos cartões em `fb6bf2a`. Os números `nº` citados abaixo são as linhas da tabela do G1.

## Correção de uma afirmação anterior

O relatório do `cto` Claude de 19/11 dizia que nada na zen-mayer "passou pela aprovação do dono". **Isso está incompleto.** Os próprios arquivos da branch registram aprovações do dono em 18/11/2026:

- os casos da T1.5: "Aprovado pelo dono em 18/11/2026 ('Aprovo'), registrado pelo CTO" (`docs/tasks/E1/T1.5.md:171`);
- a ADR-0020: "aprovada pelo dono em 18/11/2026" (`docs/decisoes/0020-regras-e1-parte-b.md:3`);
- as dependências da ADR-0021: "Aprovo as 3" (`docs/decisoes/0021-banco-e2.md:3`).

**O que falta de fato é o PR**, com CI e gitleaks, e o seu merge. As aprovações estão escritas pelo CTO da sessão de nuvem e **não dá para conferir pelo Git que você as deu**. A decisão D1, no fim deste arquivo, pede a sua confirmação.

## Por tarefa

Legenda de "casos antes do código": o commit de teste vem antes do commit `feat` da mesma tarefa, na ordem do G1.

| Tarefa | Cartão completo? | Casos antes do código | QA / revisor / CTO | Depende de (fora de `main`) | Pendências | Veredito |
|---|---|---|---|---|---|---|
| **T1.3** identidade | sim (relatório, QA, revisor, revisão do CTO) | sim: teste `8148e59` (nº 2) antes do feat `6c9de9a` (nº 3) | PASS / APROVADO / sim. O QA achou 2 bugs, corrigidos em `6af3420` e `b7bc0a2` | — (só T1.2, já em `main`) | os C2 do cartão novo **passam** (G4), mas não estão versionados como teste | **APROVEITAR COM AJUSTES:** acrescentar os C2 como teste |
| **T1.5** casos de E1-B | sim | é a própria tarefa de casos (`a4799f8` e `a266bb7`, nº 4 e 7) | não se aplica (sem código) | — | a aprovação do dono foi **registrada pelo CTO**; confirmar (D1) | **APROVEITAR** (com D1) |
| **T1.6** gastos do período | sim | sim: `2422e93` (nº 8) antes de `8122c1a` (nº 10) | PASS / APROVADO / sim | T1.5. O código não importa nada da T1.3, mas o `ROADMAP.md` a lista como dependência | **BUG-T1.6-01** aberto (`it.fails`): a soma parcial passa do inteiro seguro conforme a ordem, só perto de `MAX_SAFE_INTEGER`. Gravidade baixa | **APROVEITAR**; o bug vira cartão pequeno |
| **T1.7** transferências | sim | sim: `76bac37` (nº 42) antes de `01ae924` (nº 43) | PASS / APROVADO (rodada 1) / sim | T1.3 (`baseKeyInput` no desempate, ADR-0020 item 11), T1.6 (`domain/dates/`) | — | **APROVEITAR** |
| **T1.8** categorizador | sim | sim: `7dc1302` (nº 14) antes de `9369800` (nº 21) | PASS com 2 ressalvas de decisão / APROVADO / sim | T1.5 e T1.3 (`categorize.ts:4` importa `normalizeText`) | as ressalvas viraram o "esclarecimento 19" da ADR-0020 (`5b06c57`) | **APROVEITAR** |
| **T2.1s** ajustes da base | sim | não se aplica | revisor APROVADO / CTO sim | T2.1 (em `main`) | sobe o `next` de 16.4.1 para 16.4.6 | **APROVEITAR** |
| **T2.2** schema, migrações e RLS | sim | os testes de schema vieram junto com o feat (nº 16 e 17) | QA FAIL → rodada 1 → APROVADO / CTO sim | T2.1s | **o teste de integração não roda no CI** (sem Postgres); só o dev rodou, no local. **RISCO-T2.2-QA-02** (FK sem `user_id`) aceito. Supabase real (pooler, `BYPASSRLS`) não verificado | **APROVEITAR COM AJUSTES:** rodar `tests/integration` e `tests/qa/database-qa` num Postgres local antes do merge |
| **T2.5** casca da interface | sim | não se aplica | QA FAIL (foco cortado) → `f5abd76` → CTO sim. Revisor dispensado (front) | — | as capturas de tela ficaram fora do repo; não conferi o visual | **APROVEITAR** (você olha a tela no `pnpm dev`) |
| **T2.10** README | sim | não se aplica | QA FAIL (uma frase) → `30263e3` → CTO sim | — | — | **APROVEITAR** |
| — (`6b84bd5`, `dffb454`) | — | — | — | — | docs soltos (esclarecimento e CHANGELOG) | entram junto com a tarefa vizinha |

## Ordem do processo

- **Gate:** o E2 pode andar depois do gate E0 (`ROADMAP.md`), e as tarefas do E1-B estão no mesmo estágio. **Nenhuma trabalha em estágio com gate anterior aberto.**
- **Ordem de dependências respeitada:** a T1.6 e a T1.7 foram feitas em cima da T1.3, na própria branch. Isso só funciona se a T1.3 entrar primeiro.
- **O que falta para o gate E1 parte A:** T1.4 (ataque do QA: o `tests/qa/identity-qa.test.ts` da zen-mayer cobre a parte da T1.3), T1.4r (segunda revisão do diff de T1.1 a T1.3) e T1.4g (gate e tag `v0.1`). Nada disso está na branch.

## Conflitos

- `git merge-tree --write-tree origin/main <zen>`: **nenhum conflito**. A branch parte de `8ea548b`, a ponta atual de `main`, e entraria como fast-forward.
- **ADR:** a zen-mayer usa 0020 e 0021, e o cartão novo propõe a 0022, sem colisão (a 0022 já foi numerada pensando nisso).
- **Arquivos que mais de uma tarefa toca:** no código, só `domain/reports/spending.ts` (T1.6 e T1.7) e `package.json`/lockfile (T2.1s e T2.2). O resto da sobreposição é em docs (cartões e ADR-0020).

## Plano de PRs

O histórico é **linear e intercalado**: os commits das tarefas se alternam. Por exemplo, os nº 15 a 18 (T2.2) ficam entre a T1.3 e a T1.8. Por isso, nenhum ponto de corte deixa as tarefas inteiras. Separar um PR por tarefa exigiria cherry-pick de commits soltos e reescreveria os 63 hashes que o QA e o revisor citaram nos cartões. **O único corte limpo é a branch inteira.**

**Recomendação:** **um PR só, da branch inteira**, com o seguinte:

1. **antes de abrir:** um commit pequeno com os C2 da T1.3 (dev-backend Claude, cartão curto) e a rodada do teste de banco num Postgres local (`docker compose up`, `TEST_DATABASE_URL`), feita pelo QA, com o resultado colado no PR;
2. **no PR:** o CI roda typecheck, lint, test e **gitleaks**. Se o gitleaks achar algo, o PR para;
3. **revisão:** o `revisor` Claude lê o diff por área, numa passada cada, porque o revisor da nuvem já aprovou tarefa por tarefa e esta passada confere só o conjunto: domínio (T1.3, T1.6, T1.7, T1.8) e banco (T2.2);
4. **merge:** feito por você, depois do item 3.

## Recomendação geral

**Aproveitar a linha inteira.** O código cumpre o que foi aprovado: os casos vieram antes da implementação, o QA e o revisor passaram tarefa por tarefa, nenhuma regra do `CLAUDE.md` foi quebrada e a branch entra sem conflito. Reimplementar custaria dias de agente para chegar ao mesmo resultado. O que faltou foi **processo** (o PR, o CI com gitleaks e o teste de banco), não qualidade, e isso se resolve com os itens 1 a 4 acima.

## Decisões do dono

- **D1.** Você aprovou de fato, em 18/11, os casos da T1.5, a ADR-0020 e as três dependências da ADR-0021? (Se não, a T1.5 a T1.8 e a T2.2 voltam para aprovação antes do merge.)
- **D2.** Um PR da branch inteira (recomendado) ou PRs separados com cherry-pick (mais lento, reescreve os hashes)?
- **D3.** Aprovar a ADR-0022, que passa a registrar o que já está implementado e o contrato da T2.6 e da T3.4?
- **D4.** Marcar o cartão novo da T1.3 (`docs/E1-T1.3-cartao`) como substituído pelo da zen-mayer?
- **D5.** Uma linha que você excluiu e que volta da Pluggy: continua excluída ou é restaurada? (Não bloqueia; vai para a T3.4.)
