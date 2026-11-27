# 0028 — Estratégia UI-First: construir as 6 telas reais com contratos de ViewModel e prévia sintética antes do back-end

- **Status:** proposta (aguarda aprovação/merge do dono; alinhada ao plano `ui_first_plan.md` aprovado pelo dono em 26/11/2026)
- **Estágio:** transversal (E2/E3/E4/E5 — camada visual)
- **Atualiza em parte:** ordem de execução do `ROADMAP.md` e `docs/GUIA_ATE_V1.md` (sem alterar escopo funcional, segurança nem regras financeiras)

## Contexto

O dono decidiu priorizar a construção e validação **de toda a camada visual das 6 telas do app** (`Entrar`, `Painel`, `Transações`, `Contas`, `Enviar print` e `Revisar print`) antes de construir o back-end funcional (Drizzle/RLS, Supabase Auth, sondagem/ingestão MeuPluggy, consultas de relatório e pipeline Caju).

Ao mesmo tempo, duas regras do projeto são inegociáveis (`CLAUDE.md` / `GEMINI.md`):

1. **A interface nunca calcula regra financeira; só exibe o que o back-end entrega.**
2. **Mudança de escopo ou de ordem/dependência vira ADR antes do código**, e cada entrega continua modular (1 cartão, 1 branch `equipe-gemini/T{id}`, QA independente, revisão independente e CI verde).

## Decisão

### 1. Separação estrita em 3 camadas na UI

1. **Contratos puros (`components/contratos/ui.ts`):** apenas tipos TypeScript (`interface`/`type`) descrevendo o **ViewModel** de cada tela (`ResumoPainelVM`, `TransacoesVM`, `ContasPatrimonioVM`, `EnviarPrintVM`, `RevisarPrintVM`). Todos os valores monetários chegam como texto já formatado, percentuais/alturas prontos e status de conferência (`confere`, `verificar`, `nao_confere`, `aguardando`) prontos.
2. **Componentes de apresentação puros (`components/**`):** recebem o ViewModel por props e apenas renderizam, com **zero cálculo financeiro**, **zero cores hexadecimais `#...` soltas no JSX** (somente tokens de `@theme` em `app/globals.css`) e **zero imports de `domain/`, `lib/database/` ou `@supabase/*`**.
3. **Prévia sintética isolada (`components/previa/**`):** dados 100% fictícios (os mesmos cenários ilustrativos de `docs/design/*.dc.html`), consumidos apenas pelas páginas Server Components em `app/(app)/**` enquanto o back-end real ainda não existe, acompanhados por uma faixa discreta (`FaixaPrevia`) indicando `"Prévia visual — dados fictícios"`.

Quando o back-end de cada estágio (E2/E3/E4/E5) ficar pronto, **os componentes de apresentação não são reescritos**: apenas substitui-se a fonte de dados em `app/(app)/**` de `components/previa/` pela chamada real ao servidor.

### 2. Regras para interatividade de prévia sem regra financeira no cliente

- **Transações (`T4.4a`):** os filtros de prévia (`Conta`, `Categoria`, `Busca`) operam por `searchParams` ou cenários de prévia cujos totais (`Gastos neste filtro`) vêm pré-computados no fixture de demonstração — **nunca** somando centavos dentro de componentes JSX.
- **Revisar print (`T5.6b`):** a tela suporta todos os 4 estados visuais (`aguardando`, `erro`/`nao_confere`, `confere`, `confirmado`) via `searchParams` (`?estado=...`), com seletor discreto de demonstração na faixa de prévia, **sem** executar a conta `saldoAnterior - soma = saldoPrint` no navegador (essa conta é do `ImportService` na T5.5).
- **Navegação mobile (`T2.5b`):** no celular (`< 640px`), as telas internas `(app)` usam **barra de navegação inferior fixa** (conforme `docs/design/Enviar.dc.html`), e no desktop (`>= 640px`) mantêm o **cabeçalho superior completo** com status de sincronização e botão `"Sincronizar agora"` (conforme `docs/design/Main.dc.html`).

### 3. Mapeamento modular de cartões e branches (compatível com `tools/ci/limites.ts`)

Para manter total compatibilidade com o job `limites` da ADR-0025 (`equipe-gemini/T{id}` e `docs/tasks/E{n}/T{id}.md`), cada módulo visual recebe um sufixo explícito ligado à tarefa correspondente do Roadmap:

| Módulo | ID / Branch | Cartão | Tela / Escopo | Origem visual |
| --- | --- | --- | --- | --- |
| Base | `T2.5` (PR #30, pronta) | `docs/tasks/E2/T2.5.md` | Shell inicial + `/entrar` | `Login.dc.html` |
| V1 | `equipe-gemini/T2.5b` | `docs/tasks/E2/T2.5b.md` | Tokens `@theme`, fix `:focus-visible` (#43), `Cabecalho` completo, nav inferior mobile, `SeloConferencia`, `FaixaPrevia`, `components/contratos/ui.ts` | `Main` + `Enviar` |
| V2 | `equipe-gemini/T4.3a` | `docs/tasks/E4/T4.3a.md` | Tela **Painel** (`/`) | `Main.dc.html` |
| V3 | `equipe-gemini/T4.4a` | `docs/tasks/E4/T4.4a.md` | Tela **Transações** (`/transacoes`) | `Transacoes.dc.html` |
| V4 | `equipe-gemini/T3.7a` | `docs/tasks/E3/T3.7a.md` | Tela **Contas e patrimônio** (`/contas`) | `Contas.dc.html` |
| V5 | `equipe-gemini/T5.6a` | `docs/tasks/E5/T5.6a.md` | Tela **Enviar print do Caju** (`/importar`) | `Enviar.dc.html` |
| V6 | `equipe-gemini/T5.6b` | `docs/tasks/E5/T5.6b.md` | Tela **Revisar print do Caju** (`/importar/revisar`) | `Revisar.dc.html` |

As tarefas funcionais (`T1.3`, `T2.2`, `T2.4`, `T2.6`, `T2.7`, `E1b`, `E3`, `E1-B`, `E4`, `E5`, `E6`) continuam preservadas no `ROADMAP.md` e no GitHub Issues, e entram imediatamente após a conclusão e aprovação visual de `T5.6b`.

## Consequências

- O dono vê e valida todas as 6 telas reais no desktop (`1280px`) e no celular (`360px`) muito mais cedo, com screenshots reais produzidas pelo QA.
- Nenhuma dependência nova é necessária para a fase visual (`next`, `react`, `react-dom`, `tailwindcss` já estão instalados).
- Todos os 6 módulos tocam exclusivamente a área Gemini (`app/` fora de `app/api/`, `components/`, `tests/ui/`, `tests/qa/` e o próprio cartão), mantendo compatibilidade com os dois modos (ADR-0023 e ADR-0026).

## Aprovação do dono

- [ ] Aprovo a estratégia UI-First (ADR-0028) e os 6 cartões visuais (`T2.5b`, `T4.3a`, `T4.4a`, `T3.7a`, `T5.6a`, `T5.6b`).
