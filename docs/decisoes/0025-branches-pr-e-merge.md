# 0025 — Limites das branches, PR aberto pelo revisor e merge pelo `cto`

- **Status:** aceita pelo dono em 23/11/2026
- **Substitui em parte:** ADR-0023, seção 3 (quem abre o PR) e seção 4 (quem faz o merge)
- **Verificação automática:** job `limites` (`.github/workflows/limites.yml` e `tools/ci/limites.ts`)

## Contexto

Na ADR-0023, o dono fazia o merge de toda tarefa e levava cada PR de uma equipe para a outra. Para gastar menos tempo, o dono decidiu:

1. fixar **em quais branches** cada agente faz commit, com uma checagem automática;
2. o **revisor** abrir o PR;
3. o **`cto` Claude**, que comanda tudo, fazer o merge.

## Decisão

### 1. Branches e quem faz commit nelas

| Branch | Quem faz commit | Pode mexer em |
| --- | --- | --- |
| `equipe-claude/T{id}` | `dev-backend`, `dev-frontend`, `fixer` e `qa` Claude | área Claude (ADR-0023), `tests/qa/` e o próprio cartão `docs/tasks/E{n}/T{id}.md` |
| `equipe-gemini/T{id}` | `gemini-dev-frontend`, `gemini-dev-backend`, `gemini-fixer` e `gemini-qa` | área Gemini (ADR-0023), `tests/qa/` e o próprio cartão |
| `cto/{assunto}` | só o `cto` Claude | tudo que **não é código**: `docs/`, cartões, ADRs, gates, `CLAUDE.md`, `GEMINI.md`, `.claude/`, `.agents/`, `.github/`, `tools/`, `tests/ci/`, `package.json`, lockfile e configs |
| `claude/{nome}` (sessão de nuvem) | sessão aberta pelo dono | a mesma regra de `cto/` |
| `main` | **ninguém** | só recebe merge de PR |

- `{id}` é o id da linha do `ROADMAP.md` (`T1.3`, `T2.10a`, `T1b.2`, `T1.4r`).
- Dependência nova (`package.json`, lockfile) entra por uma branch `cto/`, com ADR, **antes** da tarefa que precisa dela.
- O job `limites` reprova o PR quando a branch está fora do padrão ou mexe fora da área. Ele roda com `pull_request_target`: o script vem da `main`, então um PR não consegue afrouxar a própria checagem. O job só lê a lista de arquivos e não executa código do PR.

### 2. Quem abre o PR: o revisor cruzado

1. O dev e o QA fazem commit e **push** na branch da tarefa. Nenhum dos dois abre PR.
2. O **revisor da outra equipe** lê `origin/main...origin/<branch>` e **abre o PR** com `gh pr create --base main --head <branch>`, com o parecer no corpo:
   - **APROVADO:** PR normal.
   - **ALTERAÇÕES:** PR em **rascunho** (`--draft`). O dev corrige na mesma branch. O revisor relê e, quando aprovar, comenta no PR e roda `gh pr ready`.
3. Se a tarefa exige o **revisor da mesma equipe** (regra financeira, banco, migração, auth, RLS, sincronização, segurança), ele comenta o parecer no PR (`gh pr comment`).
4. Os revisores continuam sem editar arquivos e sem fazer commit. Só abrem, comentam e marcam o PR como pronto.

### 3. Quem faz o merge: o `cto` Claude

O `cto` faz o merge (`gh pr merge <n> --merge --delete-branch`) quando **todas** as condições valem:

- [ ] CI verde: `check`, `gitleaks` e `limites`;
- [ ] parecer APROVADO do revisor cruzado e, quando exigido, do revisor da mesma equipe;
- [ ] QA com PASS registrado no cartão;
- [ ] a revisão final do próprio `cto`, contra o cartão e a spec;
- [ ] o PR não tem o rótulo `dono-segura`.

Continuam com o **dono**:

- merge de PR de branch `cto/` e `claude/`: processo, ADR, cartão, gate e dependência. Quem escreve não aprova o próprio trabalho;
- aprovar cartões e casos de teste antes da implementação;
- fechar gates e criar as tags;
- vetar qualquer merge pondo o rótulo `dono-segura` no PR.

## Consequências

- O dono deixa de ser o mensageiro entre as equipes em cada passo. Ele ainda avisa a outra janela que uma branch está pronta para revisão, porque as ferramentas não conversam entre si.
- O dono passa a ler o resumo do `cto` depois do merge, e não antes. A proteção está no CI, nas duas revisões e no veto `dono-segura`.
- **O dono precisa fazer no GitHub:** marcar `limites` como verificação obrigatória na regra da `main` (Settings → Branches ou Rulesets) e criar o rótulo `dono-segura`. Até isso ser feito, o job roda mas não bloqueia.
- O `gh` das sessões usa a conta do dono. Por isso a regra de merge vale pelo processo, não por permissão do GitHub. O `cto` que fizer merge fora das condições acima está violando esta ADR.
- Atualizados junto: `CLAUDE.md`, `GEMINI.md`, `docs/equipes/AGENTES.md`, `docs/equipes/GUIA_ATE_V1.md`, `docs/tasks/_TEMPLATE.md`, `.claude/agents/` e `.agents/agents/`.
