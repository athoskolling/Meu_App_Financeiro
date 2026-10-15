# Desenvolvimento multiagente — guia

Este guia explica como funciona, quem faz o quê e como rodar. O plano de tarefas está em `ROADMAP.md`. As definições dos agentes estão em `.claude/agents/`.

## 1. O que é desenvolvimento multiagente

Pense numa equipe pequena: um líder técnico (CTO) que planeja e revisa, dois desenvolvedores, uma pessoa para consertos pequenos, uma pessoa de QA, um segundo revisor de código e um tutor que só explica as coisas a você. No Claude Code, cada "pessoa" é uma instância de modelo com:

- **contexto próprio**: ela só sabe o que está no cartão de tarefa, no `CLAUDE.md` e nos arquivos que ler. Não vê a conversa do líder;
- **ferramentas próprias**: cada papel recebe só as ferramentas de que precisa;
- **modelo e esforço próprios**: Opus para decidir e revisar, Sonnet para implementar e para a segunda revisão, Haiku para tarefas pequenas, verificação e explicações.

O líder delega uma tarefa, o agente trabalha sozinho e devolve **um resumo curto**. Esse resumo, e não o trabalho inteiro, volta ao contexto do líder, o que economiza tokens e evita que o líder se perca em detalhes.

Consequência prática: **o cartão de tarefa é o briefing inteiro**. Se algo não está nele, o agente não sabe.

## 2. Subagentes ou agent teams?

O Claude Code tem duas formas:

| | Subagentes (usamos) | Agent teams (não usamos agora) |
|---|---|---|
| Como funciona | O líder chama um agente, que devolve um resumo | Várias sessões independentes com lista de tarefas compartilhada e mensagens entre si |
| Estado | Estável | **Experimental**, desligado por padrão (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) |
| Custo em tokens | Menor | Bem maior (cada colega é uma sessão inteira) |
| Quando serve | Tarefas com fronteiras claras | Pesquisa em paralelo, depuração com hipóteses concorrentes |

O projeto tem tarefas sequenciais e com dependências, e a documentação diz que, nesse caso, subagentes funcionam melhor. Fica como possibilidade futura, por exemplo para depurar um bug difícil com hipóteses em paralelo.

Detalhe técnico: por padrão um subagente pode chamar outros subagentes (até 3 níveis). Aqui isso fica **desligado**: os agentes de trabalho não recebem a ferramenta `Agent`, então só o CTO delega.

## 3. Os sete papéis

| Papel | Arquivo | Modelo | Esforço | Faz |
|---|---|---|---|---|
| **CTO** | `.claude/agents/cto.md` | Opus 5.5 | médio | Planejamento, cartões, casos de teste de regra financeira, revisão final, ADRs, gates |
| **dev-backend** | `dev-backend.md` | Sonnet 5.5 | médio | `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/` |
| **dev-frontend** | `dev-frontend.md` | Sonnet 5.5 | médio | `app/` (páginas), `components/`, estilos |
| **fixer** | `fixer.md` | Haiku 5.5 | alto | Tarefas pequenas e bugs de poucas linhas, lint, documentação |
| **qa** | `qa.md` | Haiku 5.5 | alto | `tests/`, verificação independente, relatórios de bug |
| **revisor** | `revisor.md` | Sonnet 5.5 | alto | Segunda revisão do diff (somente leitura), depois do QA e antes do CTO |
| **tutor** | `tutor.md` | Haiku 5.5 | alto | **Só explica** ao dono; somente leitura; fora do fluxo de tarefas |

São seis agentes de trabalho (os cinco do pedido original mais o revisor) e o tutor. Você, o dono, **não escreve código**: lê diffs, pede alterações, aprova merges e fecha gates.

Por que assim:
- **Regras financeiras** (dinheiro, sinal, identidade, transferências, cartão) são o coração do app e o que mais dói errar. O CTO escreve os **casos de teste** dessas regras; Sonnet implementa; Haiku **não é dono** de regra financeira. O QA verifica sem confiar no relatório do dev, e o revisor (Sonnet em esforço alto) dá uma segunda opinião independente antes do CTO.
- **Haiku em esforço alto** é ótimo para volume e verificação, mas pode perder nuances. Por isso o `fixer` só pega mudanças pequenas e localizadas e escala quando o conserto mexe em regra.
- **Opus em esforço médio** como líder: pensa o suficiente para planejar e revisar sem gastar além do necessário. Se uma decisão for difícil (ex.: Q14/Q16), suba o esforço só nela (`/effort high`).
- **O tutor existe porque você não escreve o código.** Para revisar bem e responder às perguntas dos gates, você precisa entender o que foi feito. Ele não decide, não altera nada e não está na cadeia de tarefas.

Não há um agente "dono" de segurança: auth, RLS e segredos são sempre revisados pelo revisor e pelo CTO, e conferidos por você.

## 4. Quem escreve o quê e a cadeia de revisão

Todo o código é escrito por `dev-backend`, `dev-frontend` e `fixer`. Cadeia de cada tarefa:

```
dev ──► qa ──► revisor ──► cto ──► você (merge)
```

- O `revisor` é **obrigatório** em tarefas de regra financeira, auth, RLS, banco e migração, sincronização e segurança. Nas demais, o CTO pode dispensá-lo no cartão, escrevendo o motivo (ex.: ajuste de texto).
- Em regra financeira, o CTO escreve os **casos de teste antes**, você os aprova, e só então o dev implementa. Isso substitui o "Modo A" das versões anteriores deste plano, em que você escrevia o núcleo.
- Como você não digita o código, as perguntas de explicação dos gates continuam: são a prova de que você entende o que está aprovando. Use o tutor para estudar e depois explique com as suas palavras.

## 5. Como rodar

Pré-requisitos: Claude Code **v2.1.293 ou mais novo** (o alias `haiku` só aponta para o Haiku 5.5 a partir daí, e só na API da Anthropic; em outros provedores aponta para o Haiku 4.5). Confira com `claude --version`.

1. Na raiz do repositório, com `.claude/agents/` presente, abra o CTO como sessão principal:

   ```
   claude --agent cto --model opus --effort medium
   ```

   O `initialPrompt` do CTO faz ele ler `CLAUDE.md`, este guia e o `ROADMAP.md`, dizer em que estágio estamos e propor os cartões.

2. Confira os agentes carregados com `/agents`. Devem aparecer `cto`, `dev-backend`, `dev-frontend`, `fixer`, `qa`, `revisor` e `tutor`.

3. Aprove os cartões propostos (ou peça ajustes). Depois peça: "delegue a T2.1 ao dev-backend". Também dá para chamar um agente direto com `@agent-dev-backend` ou "use o subagente qa para…".

4. Cada dev trabalha num **worktree** isolado (cópia do repositório em outra pasta e branch própria), então dois agentes não se atropelam. Ao terminar, devolve o relatório.

5. O CTO chama o `qa`, depois o `revisor` (quando obrigatório), revisa o diff e avisa quando o PR está pronto. Você lê, pede alterações se quiser, e faz o merge.

6. No fim do estágio, o CTO preenche o gate; você confere e fecha (tag no Git).

### 5.1 Tirar dúvidas com o tutor

Abra uma **segunda janela de terminal** na raiz do repositório:

```
claude --agent tutor --model haiku --effort high
```

Assim o tutor não bloqueia a sessão do CTO e você pode perguntar enquanto os agentes trabalham. Exemplos: "o que é um worktree?", "explica o relatório da T1.3", "por que dinheiro é inteiro em centavos?", "o que o revisor encontrou e o que isso significa?".

O tutor só lê (`Read`, `Glob`, `Grep`). Ele enxerga `ROADMAP.md`, os cartões e relatórios em `docs/tasks/`, os gates, a spec e o código, mas **não roda comandos**: se precisar do `git log` ou do resultado de testes, ele pede que você cole. Ele não decide, não edita e não avalia o trabalho dos outros agentes. Ao ensinar para um gate, ele explica o conceito e pede que **você** explique com as suas palavras.

Também dá para chamá-lo dentro da sessão do CTO com `@agent-tutor`, mas isso ocupa a conversa até ele responder; a segunda janela é melhor.

## 6. Ciclo de uma tarefa

```
CTO cria cartão ──► dev (worktree, branch agent/T2.4-backend) ──► relatório
                                                                      │
        ┌─────────────────────────────────────────────────────────────┘
        ▼
   QA verifica a branch do dev (não confia no relatório), adiciona testes,
   devolve PASS ou FAIL com passos para reproduzir
        │
        ├─ FAIL ─► dev corrige (máx. 2 rodadas) ─► QA de novo
        ▼
   REVISOR (Sonnet, esforço alto) lê o diff: APROVADO ou ALTERAÇÕES
        │
        ├─ ALTERAÇÕES ─► dev corrige (conta na mesma regra de 2 rodadas)
        ▼
   CTO revisa o diff contra o cartão e a spec ─► avisa o dono ─► dono lê, pede
   alterações se quiser, e faz o merge
```

Fato técnico que importa: o worktree de um subagente nasce da **branch padrão** (`main`), não da branch da sessão. Por isso:
- uma tarefa que depende de outra só começa **depois do merge** da anterior;
- o `revisor` não precisa de worktree: ele lê a branch do dev com `git fetch` e `git diff origin/main...origin/agent/...`;
- o QA, que precisa ver o código do dev, faz `git fetch` e cria a sua branch a partir da branch do dev, e abre o PR de volta para ela.

### 6.1 Acompanhar cada agente

Os agentes de trabalho (inclusive o `revisor`) têm `background: true`: rodam enquanto você continua conversando com o CTO.

- **Painel abaixo do campo de digitação:** uma linha por subagente em segundo plano. `↑` e `↓` navegam; `x` para o selecionado; `Esc` volta ao campo.
- **`/tasks`:** lista os subagentes em segundo plano com o modelo e o esforço de cada um (versão 2.1.242 ou mais nova). `Enter` abre a transcrição. Um concluído fica listado por 30 segundos.
- **`Ctrl+B`:** move para o segundo plano algo que está rodando em primeiro plano.
- **Permissões:** os pedidos de um agente em segundo plano aparecem na sua sessão, com o nome de quem pede. Aprove para continuar; `Esc` nega só aquela chamada.
- **No disco:** transcrições em `~/.claude/projects/{projeto}/{sessão}/subagents/agent-{id}.jsonl`, apagadas após 30 dias.
- **Pelo Git:** cada agente trabalha numa branch `agent/...`; `git log agent/T2.4-backend` mostra o que ele fez, e o relatório fica no cartão.
- **Limite:** até 20 subagentes ao mesmo tempo por padrão; o projeto limita a 3 escrevendo (ROADMAP). O `revisor` e o `tutor` não escrevem e não contam.

Se o segundo plano atrapalhar (por exemplo, o CTO seguir sem esperar), tire a linha `background: true` do agente: ele passa a rodar em primeiro plano e bloqueia a conversa até terminar.

## 7. Cartão de tarefa e relatório

Modelo em `docs/tasks/_TEMPLATE.md`. O cartão traz objetivo, agente responsável, **arquivos permitidos**, critérios de aceite, fora de escopo, dependências e referências à spec. O relatório do agente tem formato fixo (status, branch, arquivos, testes, decisões, riscos, pendências) para o CTO revisar rápido.

Cartões ficam em `docs/tasks/E{n}/T{nn}.md` e são commitados: viram o histórico do projeto.

## 8. Posse de arquivos (evita conflito)

| Área | Quem edita |
|---|---|
| `domain/`, `lib/`, `drizzle/`, `app/api/`, `scripts/` | dev-backend |
| `app/` (páginas), `components/`, estilos | dev-frontend |
| `tests/` | dev (testes da própria tarefa, vindos do cartão); qa (`tests/qa/`, testes adicionais) |
| `package.json`, `pnpm-lock.yaml`, `.github/`, `.claude/`, `tsconfig`, configs | só o CTO ou o dono; os devs pedem a mudança no relatório, **salvo quando o cartão lista o arquivo** (é o caso das tarefas do E0 e de dependências novas aprovadas) |
| `docs/` | CTO (cartões, ADRs, gates); fixer para correções de texto |
| Qualquer outra | fixer só com cartão que a cite |
| Nada (somente leitura) | revisor e tutor |

O revisor e o CTO conferem `git diff --name-only` em cada PR: arquivo fora da área do agente é motivo de devolução.

## 9. Quando o agente para e escala para o CTO

O agente interrompe o trabalho e reporta (sem improvisar) se:

- precisa mudar regra de **dinheiro, sinal, identidade, transferência ou cartão**, ou uma decisão da spec;
- precisa mudar o **schema** do banco ou adicionar **dependência**;
- toca em **auth, RLS, segredos** ou variáveis de ambiente;
- o cartão e a spec se contradizem, ou o critério de aceite não é testável;
- falhou duas vezes no mesmo ponto.

O CTO decide ou leva ao dono. Decisões viram ADR.

## 10. Privacidade e segredos

- **Nenhum agente lê `.env*` com valores reais nem `private/`** (JSON bruto da Pluggy, prints, dumps). `.claude/settings.json` nega leitura desses caminhos. Limite honesto: uma regra de leitura não impede um comando de shell de abrir o arquivo; por isso os cartões também proíbem, e o CTO revisa os comandos. Se quiser reforço, rode o Claude Code com o sandbox ativado.
- A sondagem da Pluggy gera um **relatório só de estrutura** (sem valores, descrições nem ids) para os agentes lerem. Fixtures são sintéticas e passam pela sua revisão antes do commit.
- Prints do Caju nunca vão ao repositório nem ao contexto dos agentes; só texto sintético.
- Logs e relatórios dos agentes não repetem valores ou descrições de transações reais.

## 11. Custos e como começar pequeno

Cada agente é uma sessão de modelo com contexto próprio, então vários agentes gastam mais que um só. Para controlar:

- Comece com **CTO + dev-backend + qa + revisor** nas primeiras tarefas; adicione frontend e fixer quando o ciclo estiver fluindo.
- O `revisor` em esforço alto custa mais que o QA: por isso é obrigatório só onde o erro dói (regra financeira, segurança, banco, sincronização).
- Use o `fixer` apenas para o que cabe em um cartão pequeno; para o resto, o custo extra de abrir um cartão não compensa.
- Veja o consumo de vez em quando (`/cost` mostra o uso da sessão) e ajuste o esforço: `/effort low` para trabalho mecânico.
- Se bater em limites de uso, reduza para um agente de cada vez.
- O tutor em Haiku é barato; use à vontade.

## 12. O que foi verificado e o que não

Verificado na documentação oficial do Claude Code: campos do arquivo de subagente (`name`, `description`, `tools`, `model`, `effort`, `isolation: worktree`, `maxTurns`, `color`, `initialPrompt`); `claude --agent <nome>`; aliases de modelo (`opus`, `sonnet`, `haiku`); níveis de esforço por modelo (inclui Haiku 5.5 com `high`); worktree nascendo da branch padrão; agent teams experimentais; painel de agentes, `/tasks`, `Ctrl+B`, `background: true` e transcrições em disco; até 20 subagentes simultâneos.

Não verificado, confira ao usar: o nome exato do comando que lista agentes (`/agents`); se `Enter` abre a transcrição de **subagentes** no painel (a documentação descreve isso para forks; para subagentes descreve `/tasks`); como o CTO é avisado da conclusão de um agente em segundo plano na sua versão; se `initialPrompt` dispara quando o agente roda como sessão principal na sua versão; a sintaxe exata das regras de negação em `.claude/settings.json` na sua versão (`/permissions` mostra o que foi carregado); como `gh` está configurado na sua máquina para abrir PRs (sem ele, os agentes só empurram a branch e você abre o PR).

## 13. Problemas comuns

- **Agente não aparece em `/agents`:** o arquivo precisa estar em `.claude/agents/` com `name` e `description`. Campos desconhecidos são ignorados em silêncio; nomes de campo diferenciam maiúsculas.
- **Haiku abre como Haiku 4.5:** versão do Claude Code antiga ou provedor diferente da API da Anthropic. Atualize, ou fixe `model: claude-haiku-5-5` nos arquivos.
- **Dois agentes editaram o mesmo arquivo:** erro de cartão (áreas sobrepostas). O CTO reescopa; em geral basta serializar as tarefas.
- **O CTO começou a escrever código:** lembre-o do papel. Ele só escreve docs, cartões e casos de teste.
- **O revisor tentou editar ou fazer checkout:** ele só lê. Lembre-o do papel e confira que o arquivo `revisor.md` não tem `Edit` nem `Write` em `tools`. O Bash dele é para leitura (`git diff`, `git show`); uma regra de ferramenta não impede um comando de escrita, então o corpo do agente também proíbe, e você vê o que ele roda no painel.
- **O tutor não sabe o que aconteceu num comando:** ele não executa nada. Cole a saída (`git log --oneline -20`, `git diff --stat`) na conversa dele.
- **O QA diz PASS sem rodar nada:** exija no relatório os comandos executados e a saída resumida; o CTO rejeita relatório sem isso.
