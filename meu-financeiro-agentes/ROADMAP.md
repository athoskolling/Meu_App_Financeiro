# Meu Financeiro — Roadmap (caminho rápido)

Este arquivo é o plano de execução. A spec (`docs/Meu_financeiro.md`) diz **o que** construir; este arquivo diz **em que ordem, por quem e quando está pronto**. Como os agentes funcionam: `docs/AGENTES.md`. Por que este plano é mais curto que o original: `docs/decisoes/` (ADR-0015).

## Como usar

- O CTO (sessão principal) lê este arquivo no início de cada sessão, descobre o estágio atual (tags do Git e `docs/gates/`) e cria um **cartão de tarefa** (`docs/tasks/`) para cada tarefa desbloqueada.
- Nenhum agente trabalha sem cartão. O cartão copia a linha da tarefa daqui e acrescenta arquivos permitidos e critérios de aceite.
- Uma tarefa só está pronta quando: os critérios do cartão passam, o QA deu PASS, o CTO revisou o diff e o CI está verde. O estágio só fecha com o gate (`docs/gates/E{n}.md`) assinado pelo dono.
- **Dúvida sobre o que está acontecendo?** Abra uma segunda janela com `claude --agent tutor` e pergunte. O tutor só explica; ele não faz parte do fluxo de tarefas.

## Legenda

| Sigla | Quem | Modelo e esforço | Faz |
|---|---|---|---|
| **DONO** | Athos | — | **Não escreve código.** Lê os diffs, pede alterações, cria contas e segredos, aprova merges, fecha gates |
| **CTO** | `cto` | Opus 5.5, médio | Planeja, escreve cartões e casos de teste, delega, revisa, prepara gates |
| **BE** | `dev-backend` | Sonnet 5.5, médio | `domain/`, `lib/`, banco, auth, integrações, `app/api/`, scripts |
| **FE** | `dev-frontend` | Sonnet 5.5, médio | Páginas, componentes, Tailwind, tela conforme o design |
| **FX** | `fixer` | Haiku 5.5, alto | Tarefas pequenas e bugs de poucas linhas, lint, documentação |
| **QA** | `qa` | Haiku 5.5, alto | Testes, verificação independente, caça a bugs, relatórios |
| **REV** | `revisor` | Sonnet 5.5, alto | Segunda revisão do diff (somente leitura), depois do QA e antes do CTO |
| **TUTOR** | `tutor` | Haiku 5.5, alto | **Só explica** ao dono o que está acontecendo. Somente leitura; fora do fluxo de tarefas |

Seis agentes trabalham no projeto (CTO, BE, FE, FX, QA, REV); o tutor é o sétimo e só conversa com você.

**Todo o código é escrito por agentes** (BE, FE, FX). Cadeia de cada tarefa: dev → QA → REV → CTO → você. O REV é obrigatório em tarefas de regra financeira, auth, banco, migração, sincronização e segurança; nas demais, o cartão pode dispensá-lo dizendo por quê. Você lê o diff, pede alterações e aprova o merge.

## Visão geral

| Estágio | Versão | Quem escreve | Pode andar em paralelo com |
|---|---|---|---|
| E0 Fundação | v0.0 | você só liga as proteções do GitHub | — |
| E1 Núcleo de domínio | v0.1 (parte A) e v0.1.1 (parte B) | agentes, com casos de teste do CTO | E1b, E2 |
| E1b Sondagem Pluggy | sem versão | agentes + você (credenciais) | E1, E2 |
| E2 Esqueleto vertical | v0.2 | agentes | E1 (só a partir do gate E0) |
| E3 Ingestão Pluggy | v0.3 | agentes | E5 |
| E4 Painel e relatórios | v0.4 | agentes | E5 |
| E5 Caju por prints | v0.5 | agentes | E3 e E4 (começa logo depois do E2) |
| E6 Fechamento | v1.0 | agentes | — |

## Dependências

```
E0 ─► E1 parte A (T1.1–T1.3) ─┬─► E3 ─► E4 ─► E6
 │                                    │    ▲     ▲
 │    E1 parte B (agentes) ───────────┼────┼─────┘  (pronta antes do E4)
 │                                    │    │
 ├─► E1b ─────────────────────────────┘    │
 │                                         │
 └─► E2 ──────────────────────────► E3     │
        └──────► E5 (em paralelo a E3 e E4) ─► E6
```

- E2 começa depois do gate E0, mesmo com o E1 em andamento. Só a T2.6 (lançamento manual) espera a T1.3 (identidade), porque usa `assignIdentities`.
- E3 precisa do E1 parte A (identidade), do E1b (formato real da Pluggy) e do E2 (banco, auth, deploy).
- E4 precisa do E3 **e** do E1 parte B (`spendingForPeriod`).
- E5 precisa do E2 (banco, auth), da T1.3 (identidade) e dos prints anonimizados do dono (T5.0). **Não espera E3 nem E4.**

## O que mudou no caminho rápido

| Antes | Agora | Efeito |
|---|---|---|
| Dono escreve E0 e E1 (Modo A) | **Você não escreve código.** Agentes escrevem tudo; você revisa e pede alterações | sem gargalo de digitação; o gargalo vira a sua revisão |
| Revisão: CTO | Revisão em camadas: QA, depois `revisor` (Sonnet, alto), depois CTO, depois você | segunda opinião independente nas partes de risco |
| E1 em uma só entrega | E1 em duas: parte A (núcleo, libera E2 e E3) e parte B (regras, antes do E4) | o E2 e o E3 não esperam as regras de relatório |
| Mesclador de prints no E1 | Mesclador vai para o E5 (T5.4) | o E1 deixa de esperar por ele |
| E5 depois do E4 | E5 logo depois do E2, em paralelo ao E3 e ao E4 | a medição de 4 semanas de prints corre durante o E1 a E4 |
| No máximo 2 escrevendo | No máximo **3** escrevendo | mais paralelismo |
| Playwright, relatórios extras e lembrete de backup no v1.0 | Vão para a v1.x | v1.0 mais enxuta |
| Sem ajuda para tirar dúvidas | Agente `tutor` (Haiku 5.5, alto), só leitura | você entende o que foi feito sem travar o fluxo |

Nada disso mexe nas regras financeiras, na segurança nem nos gates: só **quem** escreve, **em que ordem** e **quantas revisões** cada tarefa recebe. Como você não escreve código, as perguntas de explicação nos gates continuam valendo: são a prova de que você entende o que está aprovando (o tutor ajuda a preparar).

## Linha do tempo (estimativa)

Premissas: início em segunda, 19/10/2026; **2 horas por dia útil (10 h/semana)** suas, para ler diffs, aprovar, criar contas e conferir saldos; revisões em até 1 dia; feriados de 2/11, 20/11, 25/12 e 1/1 sem trabalho. As datas são aproximadas e valem para o **caso central**.

| Gate | Versão | Semana | Data alvo | O que depende de você |
|---|---|---|---|---|
| E0 Fundação | v0.0 | 1 | 23/10 | criar o repositório e proteger a `main` |
| E1 parte A (núcleo) | v0.1 | 3 | 06/11 | aprovar os casos de teste, ler 3 diffs, explicar as perguntas do gate |
| E1b Sondagem Pluggy (sem tag) | — | 4 | 13/11 | conta Pluggy, autorizar bancos, rodar o script, revisar as fixtures |
| E2 Esqueleto vertical | v0.2 | 5 | 19/11 | criar Supabase, Google OAuth e Vercel; testar o login |
| E1 parte B (regras) | v0.1.1 | 6 | 27/11 | aprovar os casos, ler os diffs |
| E3 Ingestão Pluggy | v0.3 | 8 | 11/12 | conferir saldos contra o app dos bancos |
| E5 Caju por prints | v0.5 | 9 a 11 | 08/01 | enviar prints, revisar a extração |
| E4 Painel e relatórios | v0.4 | 10 a 11 | 08/01 | conferir um mês fechado ao centavo |
| E6 Fechamento | **v1.0** | 12 | **15/01/2027** | restaurar um backup num banco vazio |

E4 e E5 andam em paralelo (e o E5 pode começar assim que o E2 fecha), então terminam perto uma da outra.

Faixa: **otimista 22/12/2026** (tudo flui, poucas rodadas de correção); **central 15/01/2027** (cerca de 12 semanas); **pessimista 05/02/2027** (Pluggy ou Caju dão problema, ou há semanas de prova). O que mais atrasa não é a velocidade dos agentes: é a espera pelo seu tempo de revisão, as conferências de saldo e o trial da Pluggy. O CTO reestima depois do gate E0, com o ritmo real.

---

## E0 — Fundação (v0.0)

O cartão de cada tarefa lista explicitamente os arquivos de configuração que o agente pode tocar (`package.json`, `tsconfig`, `.github/`, etc.), porque são exceção à regra de posse de arquivos.

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T0.1 | Repositório, `pnpm`, TypeScript `strict`, Vitest, ESLint, Prettier, scripts `test`/`typecheck`/`lint` | BE | — | os três scripts passam num teste de exemplo |
| T0.2 | Regra de lint que isola `domain/` de I/O, com prova de que barra uma importação proibida | BE | T0.1 | arquivo de exemplo viola e o lint falha |
| T0.3 | CI (typecheck, lint, test, gitleaks), `.gitignore`, `.env.example`, pasta `docs/` | BE | T0.1 | CI verde num PR vazio |
| T0.3b | Proteger `main` (PR obrigatório, CI obrigatório) e ligar as verificações de segredos do GitHub | DONO | T0.3 | configurações salvas |
| T0.4 | Verificação em clone limpo: clonar, instalar e rodar os três scripts | QA | T0.3, T0.3b | relatório PASS |
| T0.4r | Segunda revisão do CI e da regra de lint (segurança) | REV | T0.4 | APROVADO ou lista de achados |
| T0.5 | Revisão e preenchimento de `docs/gates/E0.md` | CTO | T0.4r | checklist completo; dono fecha o gate e cria a tag `v0.0` |

## E1 — Núcleo de domínio (v0.1 e v0.1.1)

Os contratos e os casos de teste estão em `docs/Fase0_roteiro.md`. Em todo o E1, o **CTO escreve os casos de teste primeiro**; o BE implementa até os testes passarem; QA, REV e CTO revisam; você lê o diff e faz as perguntas do gate.

### Parte A (v0.1): o núcleo, que libera o E2 (T2.6) e o E3

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T1.0 | Casos de teste das Tarefas 1 a 3 do roteiro (Money, NormalizedTransaction, identidade com `existingCounts`) | CTO | T0.5 | casos aprovados por você |
| T1.1 | Money (Tarefa 1 do roteiro) | BE | T1.0 | casos passam |
| T1.2 | NormalizedTransaction e validação (Tarefa 2) | BE | T1.1 | idem |
| T1.3 | Identidade e dedup com `existingCounts` (Tarefa 3) | BE | T1.2 | idem |
| T1.4 | Ataque de testes: propriedade e casos extras em `tests/qa/` (reimportação, sobreposição, bordas de centavos) | QA | cada T1.x | relatório PASS/FAIL |
| T1.4r | Segunda revisão do diff de T1.1 a T1.3 (obrigatória: regra financeira) | REV | T1.4 | APROVADO ou lista de achados |
| T1.4g | Revisão do CTO e gate E1 parte A | CTO + DONO | T1.1 a T1.4r | você explica as perguntas do gate (use o tutor para estudar); tag `v0.1` |

### Parte B (v0.1.1): regras de relatório, junto com o E2

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T1.5 | Casos de teste das Tarefas 5, 6 e 7 do roteiro, escritos antes de qualquer código | CTO | T1.2 | casos aprovados por você |
| T1.6 | Gastos do período: cartão, caixinha, parcelas, regra do mês (Tarefa 6) | BE | T1.5, T1.3 | casos passam |
| T1.7 | Transferências internas (Tarefa 5) | BE | T1.5, T1.3 | idem |
| T1.8 | Categorizador (Tarefa 7) | BE | T1.5, T1.2 | idem |
| T1.9 | Verificação independente das três (propriedade, bordas) | QA | T1.6 a T1.8 | PASS |
| T1.9r | Segunda revisão do diff de T1.6 a T1.8 (obrigatória: regra financeira) | REV | T1.9 | APROVADO ou lista de achados |
| T1.10 | Revisão do CTO e gate E1 parte B | CTO + DONO | T1.6 a T1.9r | tag `v0.1.1` |

O **mesclador de prints** (Tarefa 4 do roteiro) deixou o E1: ver T5.4.

## E1b — Sondagem Pluggy (sem versão, em paralelo ao E1 e ao E2)

Objetivo: trocar suposição por dado real antes de escrever o adapter. Os dados reais **nunca** passam pelos agentes (ver `docs/AGENTES.md`, privacidade). Comece logo, por causa do trial da Pluggy.

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T1b.1 | Criar conta na Pluggy, habilitar MeuPluggy, autorizar Santander e Nubank, guardar credenciais em `.env.local` | DONO | T0.3 | `itemId` de cada banco em mãos (cuidado com o trial: fazer tudo num dia) |
| T1b.2 | Script descartável `scripts/probe/` que baixa o JSON bruto (contas, `/v2/transactions`, cartões, investimentos, item) para `private/` e gera um **relatório só de estrutura** (campos, tipos, contagem de sinais por tipo de conta, status) sem valores, descrições nem ids | BE | T1b.1 | relatório estrutural em `docs/probe-report.md`; `private/` ignorado pelo Git |
| T1b.3 | Rodar o script com as credenciais reais | DONO | T1b.2 | JSON em `private/` |
| T1b.4 | Anonimizador: gera fixtures fictícias em `tests/fixtures/pluggy/` preservando estrutura, sinais e status, com descrições e valores sintéticos | BE | T1b.3 | fixtures revisadas **por você** antes do commit |
| T1b.5 | Varredura das fixtures (padrões de CPF, número de conta, e-mail, ids reais) | QA | T1b.4 | PASS; gitleaks limpo |
| T1b.6 | Responder a lista `[VERIFICAR]` (spec 8.5 e 5.9) em `docs/decisoes/` a partir do relatório estrutural; confirmar caixinhas | CTO + DONO | T1b.5 | cada item respondido ou marcado "não confirmável"; spec atualizada |

## E2 — Esqueleto vertical (v0.2)

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T2.1 | Projeto Next.js + Tailwind, validação de variáveis com Zod, helper de log sem dados sensíveis, `docker-compose` com Postgres local | BE | T0.5 | `pnpm dev` sobe; falha rápida sem variável obrigatória |
| T2.2 | Schema Drizzle e migrações das tabelas do MVP, RLS ligado sem políticas, índice único `(account_id, identity_key)` | BE | T2.1 | migração roda do zero local |
| T2.3 | Criar projeto Supabase, credenciais do Google OAuth, projeto Vercel; preencher variáveis | DONO | T2.1 | variáveis na Vercel e em `.env.local` |
| T2.4 | Auth: login Google, validação de sessão em toda rota, guarda `OWNER_EMAIL` | BE | T2.2, T2.3 | outra conta Google é recusada |
| T2.5 | Shell da interface: layout, navegação, tela Entrar conforme o design | FE | T2.1 | tela renderiza em desktop e celular |
| T2.6 | Lançamento manual: repositório e serviço (usa `assignIdentities`) | BE | T2.2, T1.3 | cria e lista; reenvio não duplica |
| T2.7 | Formulário e lista de lançamento manual | FE | T2.5, T2.6 | funciona ponta a ponta |
| T2.8 | Testes de integração contra Postgres em Docker: índice único, duas inserções concorrentes, RLS (anon não lê), auth (não dono recusado) | QA | T2.4, T2.6 | todos PASS |
| T2.9 | Deploy na Vercel e teste de fumaça | DONO + BE | T2.4, T2.7 | URL no ar; login funciona; migração aplicada via pooler 5432 |
| T2.10 | README de instalação, `.env.example` sincronizado, erros de lint | FX | qualquer | pequenos PRs |
| T2.11 | Revisão e gate E2 | CTO | tudo acima | `docs/gates/E2.md` completo; dono fecha; tag `v0.2` |

## E3 — Ingestão Pluggy (v0.3)

O rascunho do gate está em `docs/gates/E3.md`; o CTO o refina no início do estágio, depois da sondagem.

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T3.1 | Decidir Q15 (sincronização) e registrar ADR | CTO + DONO | E2, E1b | spec 8.6 atualizada |
| T3.2 | Cliente Pluggy: auth, contas, `/v2/transactions` com cursor, janelas por data; testado com mocks das fixtures | BE | T3.1 | testes com sucesso, paginação, erro de auth, item expirado, limite |
| T3.3 | Mapper para `NormalizedTransaction`: inversão de sinal do cartão, tipos, parcelas, status | BE | T3.2, T1.2 | testes por fixture |
| T3.4 | `SyncService`: lock em `sync_logs`, primeira carga de 12 meses, janela de 7 dias, persistência em transação com `assignIdentities` | BE | T3.3, T1.3 | sincronizar duas vezes não duplica |
| T3.5 | Holdings (caixinhas) e conferência de lacunas (5.9, 5.10) | BE | T3.4 | `reconciliation_status` preenchido |
| T3.6 | Rota do cron (protegida por `CRON_SECRET`) e endpoint de sincronização manual | BE | T3.4 | cron e botão chamam o mesmo serviço |
| T3.7 | Tela Contas (selos Confere/Verificar, conexões, Reconectar, exportação e backup) e status de sincronização no cabeçalho | FE | T3.5, T3.6 | conforme o design |
| T3.8 | Testes: sincronização repetida, concorrente, conexão expirada, lacuna, reapresentação | QA | T3.4 a T3.6 | PASS |
| T3.9 | Primeira sincronização real com Santander e Nubank; conferir os saldos contra o app do banco | DONO | T3.8 | saldos batem ou lacunas explicadas |
| T3.10 | Revisão e gate E3 | CTO | tudo | tag `v0.3` |

## E4 — Painel e relatórios (v0.4)

Escopo do v1.0: resumo do mês, categorias, cartão e patrimônio. Fluxo de caixa detalhado, comparativos e outros relatórios vão para a v1.x.

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T4.1 | Consultas do painel usando **só** `spendingForPeriod`: mês, categorias, cartão, patrimônio (contas + holdings) | BE | E3, v0.1.1 | números conferem com fixtures |
| T4.2 | Categorização integrada e `merchant_rules` (apenas esta / sempre este estabelecimento) | BE | T4.1 | regras do roteiro respeitadas |
| T4.3 | Painel conforme o design | FE | T4.1 | tela completa, desktop e celular |
| T4.4 | Transações com filtros, busca e recategorização | FE | T4.2 | conforme o design |
| T4.5 | Testes de componentes e da camada de consulta, mais um checklist manual de acessibilidade (Playwright fica para a v1.x) | QA | T4.3, T4.4 | PASS |
| T4.6 | Conferir um mês fechado contra o app do banco | DONO | T4.3 | bate ao centavo |
| T4.7 | Ajustes finos de texto e estados vazios | FX | T4.3 | pequenos PRs |
| T4.8 | Revisão e gate E4 | CTO | tudo | tag `v0.4` |

## E5 — Caju por prints (v0.5, em paralelo ao E3 e ao E4)

Começa assim que o gate E2 fecha. A medição de erro usa os prints guardados **desde a primeira semana** (T5.0).

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T5.0 | **Começar já:** guardar um print do extrato do Caju por semana, anonimizado (sem nome nem número do cartão), fora do Git, em pasta sua. Separe 2 a 3 para o desenho do parser | DONO | — | pelo menos 4 prints semanais de semanas diferentes até o gate |
| T5.1 | Decidir Q14 e Q16 (antes: confirmar a política de retenção do provedor); plano de medição e casos de teste do parser a partir do layout real | CTO + DONO | T5.0, E2 | ADR e casos em `docs/` |
| T5.2 | Parser de linhas em `domain/caju/` (texto → `NormalizedTransaction`) | BE | T5.1 | casos do CTO passam |
| T5.3 | `ExtractionProvider` com as duas implementações, saída validada por esquema, script de avaliação (taxa de erro) | BE | T5.1 | relatório de erro por extrator |
| T5.4 | **Mesclador de prints e âncora** (Tarefa 4 do roteiro, vinda do E1): o CTO manda o desenho antes; você aprova; depois o BE implementa | CTO + BE | T5.1, T1.3 | os 10 casos do roteiro passam; âncora mínima e ambiguidade documentadas |
| T5.5 | `import_items`, `ImportService`, conferência de saldo, integração com o mesclador; nada em `transactions` sem confirmação | BE | T5.2, T5.4, E2 | fluxo completo por API |
| T5.6 | Telas Enviar (celular, recorte e compressão no navegador) e Revisar conforme o design | FE | T5.5 | conforme o design |
| T5.7 | Testes: reenvio do mesmo print, sobreposição, âncora ambígua, saldo que não fecha bloqueia a confirmação | QA | T5.5, T5.6 | PASS |
| T5.8 | Medir a taxa de correção manual sobre os prints semanais acumulados e sobre o uso real | DONO + BE | T5.7 | relatório com pelo menos 4 semanas de prints |
| T5.9 | Revisão e gate E5 | CTO | tudo | tag `v0.5` |

## E6 — Fechamento (v1.0)

| ID | Tarefa | Quem | Depende de | Pronto quando |
|---|---|---|---|---|
| T6.1 | Exportação JSON e CSV | BE | E4 | arquivos corretos |
| T6.2 | Dump manual e restauração num banco vazio | DONO + QA | T6.1 | restauração confere contagens |
| T6.3 | README: seguir do zero num ambiente limpo | QA | — | PASS |
| T6.4 | gitleaks no histórico inteiro; LICENSE | QA + CTO | — | limpo |
| T6.5 | Revisão final e gate E6 | CTO | tudo | tag `v1.0` |

**Fica para a v1.x:** lembrete de backup após 30 dias na interface, testes de interface com Playwright, relatórios além dos de E4, Sheets, notificações e IA.

---

## Ritmo e limites

- No máximo **3 agentes escrevendo ao mesmo tempo**. O QA entra depois do dev da mesma tarefa e conta como escritor só quando adiciona testes. O REV e o tutor não contam: não escrevem.
- Dois agentes só rodam juntos se os **arquivos permitidos** dos cartões não se sobrepõem (ex.: `lib/integrations/pluggy/` do E3 e `domain/caju/` do E5).
- BE e FE só trabalham em paralelo quando o cartão fixa o **contrato** (tipos e rotas) entre eles.
- Máximo de **2 rodadas de correção** por tarefa; depois, o CTO reescopa ou chama o dono.
- Para começar: nas primeiras tarefas, use só CTO + BE + QA. Adicione FE e FX quando o ciclo estiver fluindo.
- Nas tarefas de segurança e regra financeira, o REV é obrigatório; nas outras o CTO pode dispensá-lo no cartão, com o motivo.
- O gargalo é o **seu** tempo de revisão. O CTO agrupa as revisões e avisa em uma linha o que espera por você.
- Mudança de escopo, de dependência ou de regra financeira vira ADR em `docs/decisoes/` antes do código.

## O que só o dono faz

- [ ] Instalar Claude Code v2.1.293 ou mais novo (necessário para o Haiku 5.5).
- [ ] Abrir uma segunda janela com `claude --agent tutor` para tirar dúvidas.
- [ ] **Já:** começar a guardar um print do Caju por semana (T5.0) e criar a conta na Pluggy (T1b.1).
- [ ] T0.3b: proteger `main` no GitHub.
- [ ] Ler os diffs e pedir alterações; aprovar os casos de teste do CTO antes de cada implementação do E1.
- [ ] Rodar o script da Pluggy com as credenciais reais (T1b.3).
- [ ] Supabase, Google OAuth, Vercel e variáveis (T2.3).
- [ ] Aprovar merges e fechar gates (as perguntas de explicação dos gates são suas; o tutor ajuda a estudar).
- [ ] Conferir saldos e um mês fechado contra o app do banco (T3.9, T4.6).
