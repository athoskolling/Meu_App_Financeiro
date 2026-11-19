# 0023 — Divisão de trabalho entre as equipes Claude e Gemini

- **Status:** aceita pelo dono em 19/11/2026 (escolheu "por área", "revisão cruzada, e dupla em regra" e "proteger a `main` agora")
- **Substitui em parte:** ADR-0015 (cadeia dev → QA → revisor → CTO → dono), na parte de branches e revisão
- **Os números 0020 e 0021** estão reservados para as ADRs da zen-mayer (tag `arquivo/zen-mayer-E1-E2`), caso sejam aproveitadas.

## Contexto

Até aqui as duas equipes (`.claude/agents/` e `.agents/agents/`) eram cópias uma da outra. As duas podiam pegar qualquer tarefa, havia dois líderes que planejavam, e cada tarefa abria duas ou três branches (dev, QA, docs). A `main` não tinha proteção. Uma sessão de nuvem fez 10 tarefas em 33 minutos numa branch própria, sem cartão aprovado e sem PR (auditoria em `docs/historico/auditoria-zen-mayer/`). Na auditoria, a revisão feita pela outra equipe achou três problemas que a revisão da própria equipe deixou passar.

## Decisão

### 1. Um só planejador

O `cto` (Claude, Opus) é o **único** que escreve cartões, ADRs, casos de teste de regra financeira e gates. O cartão diz qual equipe faz a tarefa e com qual papel. O `gemini-cto` não planeja. Ele recebe os cartões da equipe Gemini, delega dentro dela, confere a entrega antes da revisão e roda o `gemini-revisor` nos PRs da equipe Claude.

### 2. Cada equipe tem as suas áreas

| Equipe | Áreas | Por quê |
| --- | --- | --- |
| **Claude** | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/`, `middleware.ts`, e os testes delas (`tests/domain/`, `tests/lib/`, `tests/integration/`) | regra financeira, banco, auth e sincronização |
| **Gemini** | `app/` (fora de `app/api/`), `components/`, estilos, `public/`, `README.md`, e os testes de interface (`tests/ui/`) | telas a partir do contrato que a equipe Claude publica |
| Só `cto` ou dono | `package.json`, lockfile, `.github/`, `.claude/`, `.agents/`, `CLAUDE.md`, `GEMINI.md`, `tsconfig*`, configs, `docs/` (fora das seções de relatório do cartão) | regras e dependências do projeto |

- `tests/qa/` é do QA da equipe que fez a tarefa.
- Um arquivo fora da área da equipe é motivo de devolução. Se o cartão precisar de um arquivo de outra área, o `cto` divide em dois cartões.
- **Contrato entre as equipes:** a tela usa só os tipos e rotas que a equipe Claude exporta, descritos na seção "Contrato" do cartão. A interface nunca calcula regra financeira.

### 3. Uma branch por tarefa

- **Nome:** `equipe-claude/T{nn}` ou `equipe-gemini/T{nn}`, sempre criada a partir de `origin/main`. Exemplos: `equipe-claude/T1.3`, `equipe-gemini/T2.5`. Trabalho só de documentação do `cto` (cartões, decisões, gate) usa `equipe-claude/<assunto>`, por exemplo `equipe-claude/cartoes-E1A-E2`.
- O dev e o QA **da mesma equipe** fazem commit na **mesma** branch, um depois do outro. O QA não cria branch própria.
- Os revisores não fazem commit. Eles escrevem o parecer como **comentário no PR** (`gh pr comment`), e o líder da equipe autora copia o veredito para o cartão.
- **Um PR por tarefa**, da branch da tarefa para a `main`.
- Depois do merge, o GitHub apaga a branch sozinho.
- Branch fora desse padrão (por exemplo, uma sessão de nuvem `claude/<nome>`) não vira PR e é apagada.

### 4. Revisão cruzada, e dupla em regra

```
dev ─► qa (mesma equipe) ─► revisor da OUTRA equipe ─► [revisor da mesma equipe] ─► cto ─► dono (merge)
```

- **Sempre:** o revisor da outra equipe. O `gemini-revisor` revisa as tarefas Claude, e o `revisor` revisa as tarefas Gemini.
- **Também o revisor da mesma equipe** quando a tarefa toca regra financeira, banco, migração, auth, RLS, sincronização ou segurança. Na prática, toda tarefa Claude dessas áreas tem os dois revisores.
- O `cto` faz a revisão final de todas as tarefas, das duas equipes.
- O dono faz o merge. As equipes não se falam diretamente: o dono avisa a outra equipe que o PR #N está pronto para revisão.

### 5. `main` protegida no GitHub

Ativada em 19/11/2026: só entra por PR, com `check` e `gitleaks` verdes, sem push direto, sem `--force` e sem apagar a branch. A regra vale também para administradores, então vale também para as sessões que usam a conta do dono.

## Consequências

- Cada modelo sabe o que é dele pela área do cartão, e não por escolha da sessão.
- Duas tarefas de equipes diferentes podem andar ao mesmo tempo sem conflito de arquivo. Continua o limite de 3 agentes escrevendo ao mesmo tempo.
- Cada tarefa custa uma revisão a mais, com um modelo de outra família. Em regra financeira são duas revisões.
- Quando uma tarefa de tela precisa de dado novo, ela espera a tarefa Claude que publica o contrato.
- **Pendente (cartão próprio):** pôr Postgres no CI, para os testes de banco rodarem em todo PR. Até isso entrar, o QA da tarefa roda os testes de banco localmente e registra o resultado no cartão.
- Atualizados junto com esta ADR: `CLAUDE.md`, `GEMINI.md`, `docs/equipes/AGENTES.md`, `docs/tasks/_TEMPLATE.md` e os arquivos dos agentes nas duas pastas.
