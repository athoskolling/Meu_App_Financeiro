# Meu Financeiro — Especificação do Projeto (v2.3)

> v2.3: decisões da rodada de arquitetura consolidadas: hospedagem (Vercel Hobby + Supabase Free), acesso ao banco (Drizzle + pooler + RLS), login só com Google, dinheiro em `bigint` centavos, identidade/dedup com contagem de ocorrências, API `/v2/transactions`, holdings (caixinhas), conferência de lacunas, backup, CI/logs/env/testes e **entrega em estágios com gates (seção 17)**.
> v2.2: stack confirmada (Next.js + React + TypeScript); Caju só por prints (sem export disponível).
> v2.1: o Caju passa a ser importado por **prints do extrato + OCR/visão** (antes: CSV).
> Revisão da v1. Mudanças principais: escopo reduzido a um MVP, Open Finance via **MeuPluggy**, regras de dinheiro/sinal/datas/deduplicação corrigidas, e ordem de trabalho começando pelo núcleo de domínio testável.
> Itens marcados com **[VERIFICAR]** dependem de confirmação na documentação oficial antes de implementar. Não assumir nada sobre eles.

---

## 1. Visão geral

Aplicativo pessoal de controle financeiro, open source, que centraliza num único lugar as informações financeiras do dono do projeto.

Fontes de dados:

- **Santander** e **Nubank**: via Open Finance, usando **MeuPluggy** (ver seção 8).
- **Caju**: importação semanal a partir de **prints do extrato**, com extração por OCR/visão e revisão humana (seção 9).
- **Google Sheets**: espelho/exportação (pós-MVP).
- **IA**: análise e consultas em linguagem natural (pós-MVP).

Uso inicial: um único usuário (o proprietário). A arquitetura deve permitir adicionar instituições e formas de integração sem reescrever o sistema.

## 2. Objetivo principal

Eliminar ao máximo o lançamento manual de transações.

Fluxo esperado:

1. Santander e Nubank sincronizam automaticamente (via MeuPluggy).
2. Caju: o usuário envia prints semanais do extrato; o app extrai as linhas, o usuário revisa e confirma.
3. O sistema normaliza, deduplica, detecta transferências, categoriza e salva.
4. O dashboard mostra a situação financeira atualizada.

**Prioridade absoluta:** coleta e normalização corretas. UI e IA vêm depois, em cima dessa base.

## 3. Escopo por marcos

### MVP (o que entra primeiro)

1. **Base**: repositório, banco, schema, autenticação simples.
2. **Domínio financeiro**: contas, transações, categorias, transferências, cartão. Com testes.
3. **Importador Caju (prints do extrato)**: extração (OCR/visão), mesclagem de prints sobrepostos, revisão humana, normalização, deduplicação, categorização.
4. **Open Finance via MeuPluggy**: sincronização de Santander e Nubank.
5. **Dashboard mínimo**: saldo por conta, patrimônio (contas + caixinhas), gastos do mês, gastos por categoria, últimas transações, status de sincronização.

A **ordem de entrega** não segue esta lista: ela está na seção 17 (estágios com gates).

### Pós-MVP (não implementar agora, só não bloquear)

- Google Sheets
- IA (`AIService`)
- Notificações (lembrete semanal do Caju etc.)
- Exportação PDF/Excel
- Orçamentos (`budgets`)
- UI completa de regras de estabelecimento
- Redis, filas ou qualquer infraestrutura extra

## 4. Princípios

### 4.1 Open source

Nunca colocar no repositório: senhas, tokens, API keys, client secrets, refresh/access tokens, credenciais de banco, do Google ou da Pluggy, dados financeiros pessoais, CSVs pessoais, prints/imagens de extratos.

Criar `.env.example` (nomes das variáveis, sem valores reais) e `.gitignore` cobrindo:

```
.env
.env.local
*.csv
*.xlsx
*.png
*.jpg
*.jpeg
*.heic
*.webp
credentials.json
secrets/
```

Exceção controlada: arquivos **fictícios** usados em testes (CSVs, imagens e textos de OCR) ficam em `tests/fixtures/` e devem ser liberados explicitamente no `.gitignore` (ex.: `!tests/fixtures/**`). Nunca usar dados reais nas fixtures, nem prints reais com dados pessoais.

### 4.2 Privacidade e menor privilégio

- O frontend nunca recebe client secrets, credenciais ou tokens desnecessários.
- Credenciais e tokens ficam só no backend.
- Logs nunca contêm tokens, API keys ou dados de autenticação.

### 4.3 Modularidade

Integrações externas ficam isoladas. Nenhum código específico de Pluggy, Caju ou Google fora de `lib/integrations/`, com uma exceção deliberada: o parser de linhas e o mesclador de prints do Caju são **puros** (texto entra, texto sai, sem I/O) e ficam em `domain/caju/`, para serem testados sem rede nem imagem. A extração (imagem para texto) fica em `lib/integrations/caju/`.

Regra: **só criar uma interface abstrata quando houver (ou for iminente) uma segunda implementação**. No MVP existem dois adaptadores com formatos distintos (Pluggy e Caju via prints), então ambos produzem o mesmo tipo normalizado (`NormalizedTransaction`), e é essa a fronteira que importa.

### 4.4 Separação de responsabilidades

```
DADOS | REGRAS DE NEGÓCIO | INTEGRAÇÕES | INTERFACE | IA
```

Fluxo correto:

```
Fonte (Pluggy / prints do Caju)
   ↓
Adapter da integração
   ↓
NormalizedTransaction
   ↓
FinancialService (dedup, transferências, cartão, categorização)
   ↓
Banco de dados
   ↓
Dashboard
```

Regras financeiras nunca ficam em componentes React nem em código específico de provedor.

### 4.5 Módulos e estágios

Fontes e funções novas entram como módulos novos atrás de interfaces (`SourceAdapter`, `ExtractionProvider`, serviços), nunca alterando o que já passou por um gate. **Sem feature flags**: com um único usuário, flags só somam complexidade; o estágio atual é a tag que está no ar.

## 5. Regras fundamentais do domínio

Estas regras valem para todo o sistema e devem ser decididas e testadas **antes** do schema final.

### 5.1 Dinheiro

- **Nunca usar `float`.**
- No banco: `bigint` em **centavos** (decidido).
- No código: inteiros em centavos com tipo "brand" (`Cents`) para não misturar com `number` comum, validados com `Number.isSafeInteger`. Conversão para string BRL só na camada de apresentação.
- Na borda com o banco o driver pode devolver `bigint` como string: a conversão para `Cents` acontece num único ponto, com checagem de faixa segura.
- Moeda sempre explícita (`currency`, padrão `BRL`).

### 5.2 Convenção de sinal

Definir uma vez e documentar em `docs/`:

- `amount` é **com sinal**: entrada positiva, saída negativa.
- `type` classifica a natureza (`income`, `expense`, `transfer`, `credit_card_purchase`, `credit_card_payment`, `refund`, `investment`, `other`).
- Invariantes testáveis: `expense` e `credit_card_purchase` têm `amount < 0`; `income` e `refund` têm `amount > 0`. Violações são rejeitadas ou sinalizadas na normalização.
- Cada fonte tem sua própria convenção (Pluggy, Caju); o adapter converte para a convenção interna. O resto do sistema nunca vê a convenção da fonte.
- Pluggy, cartão: as linhas de cartão chegam com o sinal **invertido** (positivo = cobrança); o adapter converte. O sinal da conta corrente é conferido na sondagem (E1b).

### 5.3 Datas e fuso

- `date`: data da transação/compra (tipo `date`).
- `posted_at`: data de lançamento/efetivação, quando a fonte fornecer (nullable).
- Fuso de referência: `America/Sao_Paulo`. Timestamps em UTC no banco; conversão na borda.
- **Regra do mês (decidida):** uma transação pertence ao mês da sua própria `date`. Linhas de cartão `PENDING` (fatura aberta ou parcela futura) **entram**, e cada parcela conta no mês da sua própria `date`. O significado exato de `date` nas linhas de cartão da Pluggy (data da compra ou da parcela) é conferido na sondagem (E1b).

### 5.4 Identidade e deduplicação

Prioridade:

1. `external_transaction_id` da fonte, quando existir (escopo: `source + account + external_transaction_id`).
2. Hash determinístico + **índice de ocorrência**.

Problema da v1: hashear apenas `source + account + date + amount + merchant + description` colapsa compras legítimas idênticas (dois cafés de R$ 8 na mesma padaria no mesmo dia).

Solução (decidida na rodada de arquitetura):

```
base_key = hash(source, account, date, time?, amount, merchant/description normalizados)
identity = hash(base_key, occurrence)
```

A função de domínio é pura e recebe `existingCounts`: um mapa `base_key → quantas linhas já estão gravadas nessa conta`. O número de ocorrência depende do tipo de lote:

- **Lote completo por dia** (Pluggy com janela de dias inteiros, reimportação de arquivo): `occurrence` = posição entre as linhas iguais do lote (1, 2, 3, ...). A linha é nova só se `occurrence > existingCounts[base_key]`. Banco com 2 e lote com 3 importa 1.
- **Lote incremental** (linhas que sobraram depois da âncora de um print): `occurrence = existingCounts[base_key] + posição entre as novas iguais`, e todas são novas.
- Quem consulta o banco e grava é a camada de persistência, dentro de uma transação de banco. A garantia final é o índice único `(account_id, identity_key)`: duas sincronizações concorrentes não duplicam (a segunda cai no índice e conta como "já existente").
- Testes explícitos: reimportação integral, período sobreposto, duplicatas legítimas, lote incremental e concorrência.

Resultado da importação sempre informado:

```
37 transações encontradas
35 novas · 2 já existentes · 0 erros
```

Registrar também o hash do arquivo (`file_hash`, ou `image_hashes` para prints) na tabela `imports` para detectar reenvio do mesmo arquivo.

#### Identidade das linhas da Pluggy

- O `id` da Pluggy é só uma **dica**, não uma chave única: ele pode mudar no fechamento da fatura e na efetivação de pendentes. As linhas da Pluggy usam o mesmo esquema de `base_key` e ocorrência.
- Apagar e recriar a mesma linha (mesma `date`, `amount` e descrição na mesma conta) é uma **reapresentação**: não gera transação nova.
- Exclusão é sempre **lógica** (`deleted_at`, tombstone). Nunca apagar de verdade linhas vindas de fonte; linhas que somem da fonte ficam marcadas.
- Reconectar um `item` (novo `itemId`) não pode duplicar histórico: a identidade não depende do `itemId`.

#### Deduplicação com prints (Caju)

Prints não têm ID de transação, sucessivos se sobrepõem e valores idênticos se repetem. Contar ocorrências por chave **não basta** aqui. Estratégia:

1. A ordem das linhas dentro de um print é a ordem do extrato e deve ser preservada.
2. Ao mesclar prints (e ao comparar com o que já está no banco), **alinhar sequências**: procurar a maior sequência contígua de linhas iguais entre o fim do que já existe e o início do novo lote (âncora de sobreposição), em vez de comparar linha a linha isoladamente.
3. Se o horário aparecer no print, ele entra na chave base (reduz muito a ambiguidade).
4. Sem âncora encontrada entre o último lançamento conhecido e o primeiro do novo lote: alertar **possível lacuna** (faltou print ou o período não se sobrepõe).
5. O app mostra a âncora ao usuário antes do envio: "último lançamento importado: <data, descrição, valor>; inclua o extrato a partir dele".
6. Caso ambíguo: vai para a tela de revisão. O sistema nunca decide sozinho.

A regra do índice de ocorrência continua valendo como último recurso, dentro de um mesmo lote sem âncora.

### 5.5 Transferências internas

Transferência entre contas próprias não é despesa nem receita.

- Detecção: valores opostos, mesmo módulo, contas diferentes do mesmo usuário, janela de datas curta (configurável), descrição compatível quando possível.
- Marcar ambas as pernas com `is_transfer = true` e vincular (`transfer_pair_id`).
- Permitir correção manual (marcar/desmarcar, vincular/desvincular).
- Caso sem par (ex.: transferência para uma conta não conectada, como o Caju): tratar como transferência pendente de classificação, não como despesa automática.
- **Caixinhas e investimentos:** dinheiro movido para (ou resgatado de) caixinha ou investimento é `type = investment`: fora de gastos e de receitas, e alimenta a variação dos `holdings` (5.9).

### 5.6 Cartão de crédito

- Compra no cartão: `credit_card_purchase` (conta como despesa na data da compra).
- Pagamento da fatura: `credit_card_payment`, **nunca** conta como despesa; é movimentação entre a conta corrente e o cartão.
- Despesa total do exemplo (compra de R$ 100 + pagamento de R$ 100 da fatura) = R$ 100, não R$ 200.
- Este é o caso mais difícil do domínio. Exige testes próprios: fatura paga parcialmente, fatura paga a maior, estorno dentro da fatura, compra parcelada, pagamento em mês diferente da compra.
- **[VERIFICAR]** como a Pluggy representa contas de cartão e faturas (tipo de conta, campos de fatura, parcelas) antes de definir o mapeamento. Respondido na sondagem (E1b).

### 5.7 Categorização

Ordem de prioridade:

1. Regra manual do usuário (`merchant_rules`)
2. Estabelecimento conhecido
3. Categoria fornecida pela fonte
4. Heurística
5. IA (pós-MVP)
6. `Outros`

Ao corrigir uma categoria, oferecer: "apenas esta transação" ou "sempre para este estabelecimento" (cria `merchant_rule`).

### 5.8 Saldo e patrimônio

- Saldo vem da fonte quando disponível (Pluggy para Santander/Nubank).
- **Caju não tem integração; o saldo só existe se aparecer no print.** Se o print mostrar o saldo, extraí-lo e confirmá-lo na revisão (`balance_source = ocr_confirmed`). Se não aparecer, o usuário informa manualmente (`manual`). Alternativas: derivar do extrato (`derived`, sujeito a erro) ou deixar o Caju fora do "Patrimônio". Sempre exibir a data da última atualização do saldo.
- Quando houver saldo anterior e novo no print, usá-lo como **verificação cruzada** da extração: `saldo_anterior + soma(lançamentos) = saldo_novo`.

### 5.9 Investimentos e caixinhas (holdings)

- `holdings` guarda posições: nome, tipo, saldo e data de atualização, lidas do recurso de investimentos da Pluggy. **Sem transações de investimento no MVP.**
- A documentação da Pluggy diz que cofrinhos e caixinhas do Nubank se configuram como CDBs, então devem chegar como investimentos. **[VERIFICAR]** na sondagem (E1b) se o MeuPluggy realmente as expõe. Se não expuser, o plano muda: saldo informado à mão ou caixinhas fora do patrimônio.
- Patrimônio = saldos de contas + holdings. A fatura aberta e o saldo do Caju (benefício restrito a alimentação) ficam **fora** da soma e aparecem à parte.

### 5.10 Conferência de lacunas na Pluggy

A cada sincronização, comparar o saldo da conta com o saldo derivado dos lançamentos e, quando o campo `balance` da transação vier preenchido, conferir a sequência. Se não fechar, a conta fica com `reconciliation_status = gap` ("dados possivelmente incompletos", com a diferença) em vez de aceitar em silêncio. Motivo: há relatos de transações faltando (adiantamento de parcela e de fatura, Pix no cartão) em conexões do Nubank via Pluggy.

## 6. Stack, hospedagem e acesso aos dados

Decidido na rodada de arquitetura:

- **App:** Next.js + React + TypeScript + Tailwind CSS. API routes no início, com camadas separadas (`domain`, `lib/finance`, `lib/integrations`, `lib/database`).
- **Banco:** PostgreSQL no **Supabase Free** (500 MB; sem backup automático; projetos de baixa atividade são pausados após cerca de 7 dias; restauração possível por até 1 ano).
- **Hospedagem:** **Vercel Hobby** (R$ 0). Limites que importam: cron no máximo 1 vez por dia (com tolerância de até 59 min), função com no máximo 300 s, corpo de requisição de até 4,5 MB.
- **Acesso ao banco:** **Drizzle ORM**, **somente no servidor**. O app conecta pelo pooler compartilhado do Supabase em modo transação (porta 6543) com `prepare: false`. As migrações rodam da máquina local pelo pooler em modo sessão (porta 5432), porque a conexão direta é IPv6 por padrão.
- **RLS:** ligado em **todas** as tabelas, **sem políticas** (nega tudo para `anon` e `authenticated`). Nenhum acesso a dados pelo navegador com `supabase-js`.
- **Docker:** o código fica pronto para `docker compose up` (`app` + `postgres`) como plano B. Sem Redis, filas ou outros serviços sem necessidade comprovada.
- **Plano B de hospedagem:** VPS (cerca de R$ 50 a 60 por ano, mais domínio opcional de cerca de R$ 40 por ano) se os limites da Vercel ou do Supabase passarem a atrapalhar. Firebase foi descartado: o Firestore é NoSQL e o Postgres deles é só um trial de 3 meses. Domínio pago é opcional e fica fora da arquitetura.

## 7. Estrutura de diretórios

O núcleo de domínio **não depende de framework, banco ou rede**: é TypeScript puro e testável isoladamente.

```
/
├── domain/                  # núcleo puro (sem I/O)
│   ├── money/               # tipo Money, conversões
│   ├── transactions/        # NormalizedTransaction, identidade/dedup, tipos
│   ├── transfers/           # detector de transferências
│   ├── credit-card/         # compra x pagamento de fatura
│   ├── categories/
│   ├── accounts/
│   └── caju/                # parser de linhas e mesclador de prints (puros)
├── lib/
│   ├── database/            # schema, migrations, repositories
│   ├── auth/
│   ├── finance/             # FinancialService, SyncService, ImportService
│   └── integrations/
│       ├── pluggy/          # cliente MeuPluggy/Pluggy + mapper -> NormalizedTransaction
│       └── caju/            # ExtractionProvider (imagem → texto cru) + mapper
├── app/                     # Next.js (páginas + api/)
├── components/
├── scripts/
├── tests/
│   ├── fixtures/            # prints, textos de OCR e respostas de API FICTÍCIOS
│   └── ...
├── docs/                    # decisoes/ (ADRs) e gates/ (checklist por estágio)
├── .github/workflows/       # CI
├── .env.example
├── .gitignore
├── README.md
├── Dockerfile
└── docker-compose.yml
```

Diretórios de Sheets, IA e notificações são criados apenas quando essas fases começarem.

## 8. Open Finance via MeuPluggy

### 8.1 O que é e o que a documentação oficial diz

MeuPluggy é a rota gratuita da Pluggy para pessoa física ler os **próprios** dados via API. Segundo a documentação oficial da Pluggy:

- É para **uso pessoal**: até **5 conexões**, **sem uso comercial**.
- É gratuito, sem due diligence, e não expira com o trial.
- O usuário conecta os bancos no **Meu Pluggy** (meu.pluggy.ai); a conexão é mantida e atualizada pelo MeuPluggy (a documentação indica atualização diária).
- No Dashboard da Pluggy (dashboard.pluggy.ai), cria-se uma **Application** (gera `clientId` e `clientSecret`) e habilita-se o conector **MeuPluggy** (é um conector "Direct", grupo Personal).
- Autoriza-se uma vez **por banco** (não por conta) vinculando o MeuPluggy à conta de desenvolvedor, o que gera um **`itemId`**.
- A API usa `POST /auth` (credenciais → API key) e depois `GET /accounts?itemId=…` e **`GET /v2/transactions`** (o `GET /transactions` está descontinuado e será removido após 31/12/2026), com o header `X-API-KEY`. A v2 pagina por cursor (`after`/`next`, até 500 por página) e aceita `dateFrom`, `dateTo` e `createdAtFrom`. Revalidar na sondagem (E1b).

Fontes: guia "Personal use: read your own data with Meu Pluggy" (docs.pluggy.ai), repositório `pluggyai/meu-pluggy` e guia oficial em meu.pluggy.ai/api-guide.

### 8.2 Passo a passo de configuração (manual, feito uma vez pelo dono)

1. Criar conta no Meu Pluggy e conectar Santander e Nubank pelo site.
2. Criar conta no Dashboard da Pluggy, criar uma Application e copiar `clientId` e `clientSecret`.
3. Habilitar o conector MeuPluggy (Customization → Connectors).
4. Fazer a autorização do MeuPluggy (uma vez por banco) e copiar o `itemId` de cada banco.
5. Guardar `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` em variáveis de ambiente e os `itemId`s na tabela `connections`.

**Atenção:** relatos de uso indicam que a **configuração da lista de conectores só pode ser editada enquanto o trial da conta Pluggy estiver ativo**. Fazer os passos 2 a 4 logo após criar a conta. **[VERIFICAR]** esse comportamento na documentação atual.

### 8.3 Consequências para o projeto

- **Não há fluxo de consentimento dentro do app.** O consentimento acontece no Meu Pluggy. O app só recebe e guarda o `itemId`. A tela "Adicionar conta" vira "Vincular itemId" com instruções (e um estado de erro claro quando a conexão expira).
- **Projeto open source e uso pessoal:** cada pessoa que clonar o repositório precisa da própria conta Meu Pluggy + Application Pluggy. O README deve explicar isso. O limite de 5 conexões e a proibição de uso comercial valem; o projeto não deve ser oferecido como serviço para terceiros.
- **Dependência de plataforma:** o app passa a depender da Pluggy e do MeuPluggy. O adapter isola isso, mas a mudança de provedor exigiria nova integração, sem garantia de gratuidade equivalente.
- O `itemId` e as credenciais da Pluggy são **sensíveis**: só no backend, `itemId` tratado como segredo (não logar, não expor ao frontend além do necessário).
- **Consentimento:** o Banco Central retirou o teto fixo de 12 meses; a validade passou a ser negociada entre as instituições, e a renovação é simplificada (confirmar no ambiente do banco). O prazo real para Santander e Nubank via MeuPluggy não foi confirmado. O app trata `item` expirado ou em erro mostrando "Reconectar" (tela Contas), nunca falhando em silêncio.

### 8.4 Adapter

Código restrito a `lib/integrations/pluggy/`. Responsabilidades:

- Obter a API key via `POST /auth` a cada execução serverless (no máximo um cache curto em memória do módulo, tolerando perda a qualquer momento). Nunca persistida em texto puro, nunca enviada ao frontend.
- Listar contas por `itemId` e transações via `/v2/transactions`.
- Mapear respostas para `NormalizedTransaction` e `Account` do domínio, aplicando a convenção de sinal da seção 5.2.
- Traduzir erros da Pluggy (conexão expirada, item em erro, rate limit) em erros de domínio com mensagem útil.

Fora do adapter: nenhuma regra financeira, nenhum conhecimento de formato Pluggy.

### 8.5 Itens a verificar na documentação oficial antes de implementar

- **[VERIFICAR]** Santander e Nubank (pessoa física) estão disponíveis via MeuPluggy e quais produtos cobrem (conta, cartão, investimentos).
- **[VERIFICAR]** validade da API key e política de renovação.
- **[VERIFICAR]** ordenação e comportamento de `createdAtFrom` e `dateFrom` em `/v2/transactions` para a janela deslizante (paginação por cursor e tamanho de página já constam na documentação).
- **[VERIFICAR]** campos reais de transação (id, data, valor, sinal, tipo, categoria, status pendente/efetivado, dados de cartão e parcelas).
- **[VERIFICAR]** status do `Item` e como detectar conexão expirada ou que exige reautorização.
- **[VERIFICAR]** limites de requisições.
- **[VERIFICAR]** se há webhooks no fluxo MeuPluggy ou apenas consulta por polling.
- **[VERIFICAR]** comportamento de transações pendentes (podem mudar de id/valor ao efetivar, afetando a deduplicação).
- **[VERIFICAR]** sinal das linhas da conta corrente.
- **[VERIFICAR]** significado de `date` nas linhas de cartão (compra ou parcela).
- **[VERIFICAR]** se as caixinhas do Nubank chegam como investimentos (5.9).

Todos esses itens são respondidos na **sondagem com dados reais (E1b)**: um script descartável salva o JSON bruto fora do Git e gera fixtures anonimizadas. Antes disso, desenvolver contra **mocks** com respostas fictícias.

### 8.6 Sincronização

`SyncService` (em `lib/finance/`):

1. Listar conexões ativas.
2. Consultar `last_sync_at` e buscar apenas o necessário (incremental, se a API permitir; caso contrário, janela deslizante com deduplicação).
3. Chamar o adapter e receber `NormalizedTransaction[]`.
4. Deduplicar (seção 5.4), detectar transferências (5.5) e cartão (5.6), categorizar (5.7).
5. Persistir em transação de banco (tudo ou nada por conexão).
6. Registrar `sync_logs`.

**Proposta (decisão Q15, adiada para o início do E3):**

- Vercel Cron 1 vez por dia mais o botão "Sincronizar agora". A rota do cron exige `CRON_SECRET`.
- Polling de `GET /v2/transactions`. Webhooks só se o MeuPluggy os oferecer (não encontrados na documentação).
- **Lock de concorrência:** linha em `sync_logs` com `status = running` e expiração; uma segunda execução simultânea sai sem fazer nada.
- **Primeira sincronização:** importa tudo o que vier (até 12 meses). Depois, janela deslizante de cerca de 7 dias, com margem para absorver pendentes que mudam.
- Conferência de lacunas ao final (5.10).

## 9. Caju (prints do extrato + OCR)

Sem API e sem CSV. O usuário envia **prints semanais** do extrato no app Caju.

### 9.1 Pipeline

```
imagem(ns)
   ↓
ExtractionProvider   (OCR local ou modelo de visão) → linhas candidatas + confiança
   ↓
RowParser            (datas relativas, valores BRL, sinal) → ExtractedRow[]
   ↓
OverlapMerger        (une prints sobrepostos por alinhamento de sequências)
   ↓
Validação            (formato, soma x saldo, anomalias)
   ↓
Tela de revisão      (imagem ao lado das linhas; usuário corrige e confirma)
   ↓
FinancialService     (dedup contra o banco, categorização)
   ↓
Banco
```

Regra: **nada vai para `transactions` sem confirmação do usuário.** As linhas extraídas ficam em `import_items` (staging) até a revisão.

Separar **extração** (imagem → texto/estrutura) de **parsing** (texto/estrutura → domínio). O parser e o mesclador trabalham sobre texto e são testados sem nenhuma imagem.

### 9.2 Extração

Isolada atrás de `ExtractionProvider` (entrada: imagem; saída: linhas candidatas com texto cru e confiança). Opções:

- **OCR local** (ex.: Tesseract, PaddleOCR): os dados não saem da máquina; mais frágil com o layout de um app, exige parsing cuidadoso.
- **Modelo de visão via API** (ex.: Claude): bem mais robusto com layouts, mas **envia o print a um terceiro**. Conflita com o princípio de enviar à IA só o necessário; exige decisão consciente, recorte da área da lista (sem nome/número do cartão) e nenhuma credencial no print.
- **Híbrido** (local primeiro, visão só nas linhas de baixa confiança): só se a medição justificar a complexidade.

A escolha é feita **medindo** (decisão 6): mesmo conjunto de prints reais anonimizados, taxa de linhas erradas por extrator.

**Candidatos (decisão Q14, adiada para o início do E5):** Claude (API da Anthropic, retenção padrão de 30 dias) e GPT-5.6 Luna (OpenAI, entrada de texto e imagem, cerca de US$ 0,20 por milhão de tokens de entrada e US$ 1,20 de saída, sem camada gratuita na API). Estimativa de custo abaixo de US$ 1 por ano. Antes de usar a OpenAI, **verificar a política de retenção de dados**. Escolher pela menor taxa de erro medida.

Segurança da extração por modelo de visão: saída validada contra um esquema (JSON schema); texto presente na imagem (ex.: descrição de estabelecimento) é **dado, nunca instrução**.

Variáveis de ambiente (nomes, sem valores): `EXTRACTION_PROVIDER` (`local` | `vision`) e, se aplicável, a chave do provedor de visão.

### 9.3 Particularidades dos prints

- Sem ID de transação e, em geral, sem ano na data: inferir pelo contexto/ordem e pelo mês do print; registrar `captured_at`.
- Datas relativas ("Hoje", "Ontem") resolvidas com a data de captura, confirmada pelo usuário.
- Horário, quando visível, é preservado.
- Sinal pode vir apenas da cor ou de um prefixo: converter para a convenção 5.2.
- Descrições truncadas ("…"): marcar `description_truncated`.
- Estado pendente/efetivado, quando exibido.
- Elementos de interface (barra de status, botões, cabeçalhos por dia) são ignorados.
- Um extrato semanal pode exigir **vários prints** com rolagem; orientar a capturar com sobreposição.

### 9.4 Mesclagem e âncora

Descritas na seção 5.4 (deduplicação com prints). A tela de envio mostra o último lançamento já importado como âncora e avisa sobre possível lacuna.

### 9.5 Revisão obrigatória

- Imagem e linhas editáveis lado a lado.
- Destacar: linhas de baixa confiança, valores suspeitos (outliers, sinal incomum, data fora do período), duplicatas prováveis e a lacuna, se houver.
- Ações: confirmar tudo, editar linha, descartar linha, adicionar linha faltante.
- Verificação cruzada com saldo (5.8) quando o print o trouxer; divergência bloqueia a confirmação rápida.
- Resumo final: "N linhas extraídas · M novas · K já existentes · J corrigidas manualmente".
- Registrar a taxa de correção manual (linhas corrigidas / total) para avaliar o extrator ao longo do tempo.

### 9.6 Privacidade das imagens

- Prints contêm dados pessoais. Padrão: **não persistir a imagem** após a confirmação; guardar apenas o hash.
- Se persistir, usar storage privado com expiração. Imagens nunca no Git e nunca em logs.
- Upload: validar tipo (png, jpg, heic, webp) e tamanho; remover metadados (EXIF).
- Com API externa de visão, enviar só o necessário.
- **Proposta (Q16, decidir no início do E5):** recorte da área da lista e compressão para JPEG no navegador; um print por requisição, abaixo de 4,5 MB (limite da Vercel); guardar só as linhas extraídas e o hash.

### 9.7 Atualização semanal

Tela do Caju: "Última atualização", "Próxima atualização recomendada" (7 dias após a última importação) e botão "Enviar prints". O lembrete automático fica no pós-MVP.

## 10. Banco de dados

`user_id` em todas as tabelas de dados, mesmo com um único usuário.

### MVP

- `users`: id, email, name, created_at, updated_at
- `institutions`: id, name, slug, type, logo_url, created_at
- `connections`: id, user_id, provider (`pluggy`, `caju_ocr`), institution_id, `external_item_id` (itemId, tratado como segredo), status, last_sync_at, created_at, updated_at
- `accounts`: id, user_id, connection_id, institution_id, external_account_id, name, type (`checking`, `savings`, `credit_card`, `benefit`, `investment`, `other`), currency, balance, available_balance, `balance_source`, `balance_updated_at`, `reconciliation_status` (`ok`, `gap`, `unknown`), `reconciliation_diff`, masked_number, status, last_sync_at, created_at, updated_at
- `transactions`: id, user_id, account_id, external_transaction_id, `identity_key` (único por conta), source (`open_finance`, `caju_ocr`, `manual`), `date`, `posted_at`, description, merchant_name, `amount` (`bigint`, centavos, com sinal), currency, type, category_id, status (`pending`, `posted`), is_transfer, `transfer_pair_id`, is_recurring, metadata (jsonb), `deleted_at` (exclusão lógica), created_at, updated_at
- `categories`: id, user_id, name, parent_id, icon, color, created_at, updated_at
- `merchant_rules`: id, user_id, merchant_pattern, category_id, created_at, updated_at
- `imports`: id, user_id, source, filename, file_hash / `image_hashes`, `captured_at`, `extractor`, period_start, period_end, total_rows, imported_rows, duplicate_rows, error_rows, created_at
- `import_items` (staging da revisão): id, import_id, image_index, row_index, raw_text, parsed_date, parsed_amount, parsed_description, confidence, status (`pending`, `confirmed`, `edited`, `rejected`), transaction_id (nullable)
- `holdings`: id, user_id, connection_id, external_id, name, type, balance (`bigint`, centavos), currency, balance_updated_at, created_at, updated_at
- `sync_logs`: id, user_id, connection_id, started_at, finished_at, status (`running`, `ok`, `error`), `lock_expires_at`, accounts_synced, transactions_synced, error_message, metadata

Restrições importantes: índice único em `(account_id, identity_key)`; `identity_key` nunca nula; RLS ligado em todas as tabelas, sem políticas (seção 6).

### Pós-MVP

- `budgets`: id, user_id, category_id, month, year, amount, created_at, updated_at
- `notifications`: id, user_id, type, title, message, read_at, scheduled_for, created_at

### Segredos

`itemId` e quaisquer tokens, quando persistidos, devem ser **criptografados** (chave em variável de ambiente, fora do banco). Nunca em texto puro nos logs.

### Categorias padrão

Alimentação (Mercado, Restaurante, Delivery, Café, Padaria) · Transporte (Uber, 99, Combustível, Estacionamento, Transporte público) · Moradia (Aluguel, Condomínio, Energia, Internet, Outros) · Saúde · Educação · Lazer · Compras · Assinaturas · Viagens · Impostos · Investimentos · Renda · Transferências · Outros

## 11. Dashboard (MVP)

- **Contas**: saldo por conta (Santander, Nubank, Caju) com data da última atualização e origem do saldo.
- **Gastos**: mês atual, mês anterior, média mensal. Exclui transferências e pagamentos de fatura.
- **Categorias**: distribuição de gastos do mês.
- **Fluxo de caixa**: receitas, despesas, saldo.
- **Últimas transações.**
- **Status de sincronização**: por conexão (atualizado / desatualizado / erro), com ação de reconectar ou importar.

Patrimônio = contas + holdings (5.9), exibido com a ressalva da seção 5.8 (contas sem saldo confiável). Cada conta mostra o selo **Confere** ou **Verificar**, vindo da conferência de saldo (5.10 e 9.5). A primeira versão visual está no artefato de design "Meu Financeiro" (telas Painel, Transações, Contas, Entrar, Revisar print e Enviar print).

## 12. Relatórios (pós-MVP, exceto o essencial)

Filtros: período, conta, instituição, categoria, tipo, estabelecimento. Relatórios: gastos por categoria/instituição/estabelecimento, receitas, evolução mensal, fluxo de caixa. Exportação CSV primeiro; Excel e PDF depois.

## 13. Google Sheets, notificações e IA (pós-MVP)

Mantidos como na v1, com as ressalvas:

- **Google Sheets**: destino secundário, nunca banco principal; sincronização idempotente; criar `GoogleSheetsService` só nesta fase.
- **Notificações**: lembrete semanal do Caju (se última importação > 7 dias), dentro do app e por e-mail.
- **IA**: camada de análise sobre dados **agregados** calculados pelo backend; nunca recebe credenciais, tokens ou `itemId`; criar a abstração `AIService` quando a fase começar.

## 14. Segurança, erros, backup e exclusão

- **Login (decidido):** apenas Google (OAuth do Supabase Auth). O servidor valida a sessão em **toda** rota e compara o e-mail com `OWNER_EMAIL`; qualquer outra conta é recusada. O cadastro público é desligado depois do primeiro login do dono (se o primeiro login falhar com o cadastro desligado, liga-se uma vez e desliga-se de novo). O 2FA fica por conta do Google. Sem multiusuário na v1.
- Erros sempre com mensagem útil e ação, nunca "Error 500". Exemplos: "Não foi possível atualizar o Nubank. Sua conexão pode ter expirado. [Reconectar]"; "Não consegui ler esse print como um extrato do Caju. Envie uma imagem nítida da lista de lançamentos."
- **Logs:** JSON estruturado via `console`, **sem valores, descrições de transação, tokens ou dados pessoais**: só ids, contagens, durações e códigos de erro. A retenção de logs da Vercel Hobby é curta; o histórico que importa fica em `sync_logs`.
- **Variáveis de ambiente:** `.env.example` no repositório (sem valores); os reais ficam na Vercel e em `.env.local` (ignorado pelo Git). Validadas com Zod na inicialização (falha rápida). Lista inicial: `DATABASE_URL` (pooler 6543), `DATABASE_URL_MIGRATIONS` (5432), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OWNER_EMAIL`, `CRON_SECRET`, `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`. As chaves de extração entram no E5. A chave `service_role` do Supabase não é usada pelo app.
- **Backup (decidido):** exportação JSON/CSV dentro do app **e** dump manual mensal (`supabase db dump`) guardado fora do repositório, com lembrete após 30 dias. Nenhum dump no repositório nem em artefatos de CI do repositório público. O Supabase Free não faz backup automático.
- Exclusão: excluir transações, desconectar fonte e excluir conta, sempre com confirmação explícita.
- Em ambientes de teste e CI, **nunca** usar contas bancárias reais nem credenciais reais da Pluggy.

## 15. Testes

Obrigatórios antes de fechar o gate de cada estágio (seção 17).

**Domínio (prioridade máxima):**

- Soma de receitas e despesas; invariantes de sinal.
- Transferências internas (com e sem par, janela de datas).
- Cartão: compra, pagamento total/parcial/a maior, estorno, parcelas.
- Reembolsos.
- Deduplicação: reimportação total, período sobreposto, **duplicatas legítimas idênticas**.
- Dinheiro: arredondamento, conversão de centavos, parsing de `1.234,56`.

**Caju (prints):**
- Parser sobre textos de OCR fictícios: valores `1.234,56`, sinal por cor/prefixo, datas sem ano, "Hoje"/"Ontem", descrição truncada, linhas de interface.
- Mesclador: prints sobrepostos, sem sobreposição (lacuna), mesma sequência enviada duas vezes, **linhas idênticas legítimas dentro e entre prints**, ordem preservada.
- Verificação de saldo (anterior + lançamentos = novo).
- Extrator: avaliado à parte com um conjunto fixo de prints anonimizados (taxa de erro por extrator), não nos testes unitários.

**Integração Pluggy:** adapter testado contra respostas **mockadas** (sucesso, paginação, erro de autenticação, conexão expirada, rate limit).

**IA (futuro):** respostas verificadas com dados fictícios.

**Política (decidida):** domínio com testes primeiro (os casos são escritos antes do código). Persistência, a partir do E2, com testes de integração contra um Postgres local em Docker, incluindo o índice único de identidade e duas sincronizações concorrentes. Sem testes E2E de navegador até o E4. Sem meta de cobertura em porcentagem: o gate é cada caso do checklist passar. CI (GitHub Actions) roda `tsc --noEmit`, ESLint (com regra que impede `domain/` de importar I/O: `fs`, `fetch`, Drizzle, Next), Vitest e gitleaks. A `main` é protegida e o trabalho vai por PR.

## 16. Decisões

| # | Decisão | Status |
|---|---------|--------|
| 1 | Stack | **Decidido:** Next.js + React + TypeScript |
| 2 | Saldo do Caju | Padrão: do print, senão manual. Confirmar com os prints reais |
| 3 | Layout real do extrato do Caju | **Pendente:** usuário fornece 2 a 3 prints anonimizados antes do E5 |
| 4 | Cartão e fatura na Pluggy | Resolvido na sondagem (E1b) |
| 5 | Moeda interna | **Decidido:** centavos inteiros no código, `bigint` no banco |
| 6 | Motor de extração (Q14) | **Adiado:** decidir no início do E5, medindo (9.2) |
| 7 | O Caju oferece export? | **Decidido:** não. Prints são a única via |
| 8 | Hospedagem | **Decidido:** Vercel Hobby + Supabase Free; Docker-ready; VPS como plano B |
| 9 | Acesso ao banco | **Decidido:** Drizzle só no servidor, pooler 6543, RLS sem políticas |
| 10 | Login | **Decidido:** Google, `OWNER_EMAIL`, cadastro público desligado |
| 11 | Sincronização (Q15) | **Adiado:** decidir no início do E3 (proposta em 8.6) |
| 12 | Prints no cliente (Q16) | **Adiado:** decidir no início do E5 (proposta em 9.6) |
| 13 | Caixinhas | **Decidido:** holdings no MVP. Se o MeuPluggy as expõe, é resolvido no E1b |
| 14 | Backup | **Decidido:** export no app + dump mensal manual |
| 15 | CI, logs, variáveis de ambiente e testes | **Decidido** (seções 14 e 15) |
| 16 | Forma de entrega | **Decidido:** estágios com gates (seção 17); caminho rápido e agentes escrevem todo o código (ADR-0015) |

## 17. Entrega em estágios com gates

Cada estágio vira uma **versão** (tag no Git) e só começa quando o gate do anterior passou. Os módulos entram por interfaces e pastas, sem feature flags (4.5).

| Estágio | Versão | Entrega | Gate (resumo) |
|---|---|---|---|
| **E0 Fundação** | v0.0 | Repositório, CI, `CLAUDE.md`, docs, spec v2.3 | CI verde. Lint isola `domain/`. Varredura de segredos limpa |
| **E1 Núcleo de domínio** | v0.1 (núcleo) e v0.1.1 (regras) | Parte A: Money, NormalizedTransaction, identidade e dedup. Parte B: gastos do período (cartão, caixinha), transferências, categorizador. O mesclador de prints foi para o E5 | Todos os casos do roteiro passam. Dinheiro sem float. Identidade usa o mapa de contagens. A parte B fecha antes do E4 |
| **E1b Sondagem Pluggy** (paralela ao E1, descartável) | sem versão | Script que baixa o JSON bruto de contas, transações, cartões e investimentos | Itens `[VERIFICAR]` respondidos em `docs/decisoes/`. Veredito sobre as caixinhas. Fixtures anonimizadas. Nenhum dado real no Git |
| **E2 Esqueleto vertical** | v0.2 | Next.js, Drizzle, Supabase, login Google, RLS, deploy, lançamento manual | Outra conta Google é recusada. A chave anon não lê nada. A migração roda do zero. O deploy na Vercel funciona |
| **E3 Ingestão Pluggy** | v0.3 | Adapter, `SyncService`, cron diário e botão, lock, conferência de lacunas, holdings | Sincronizar duas vezes não duplica. O saldo fecha, ou a conta é marcada como incompleta. Conexão expirada mostra "Reconectar". A primeira carga traz 12 meses |
| **E4 Painel e relatórios** | v0.4 | Resumo mensal, categorias, cartão, patrimônio | Um mês fechado bate com o app do banco ao centavo. Transferência para caixinha não conta como gasto |
| **E5 Caju por prints** | v0.5 | Parser de linhas, mesclador de prints, `ExtractionProvider`, staging, tela de revisão | Taxa de erro medida em pelo menos 4 semanas de prints reais. Nada vai para `transactions` sem confirmação. Conferência de saldo funciona. Reimportar o mesmo print não duplica |
| **E6 Fechamento** | v1.0 | Export, backup com restauração testada, logs, README | Dump restaurado num banco vazio. Varredura de segredos no histórico inteiro. O README sobe o projeto do zero |
| **Pós-MVP** | v1.x | Sheets, notificações, IA, relatórios extras | Cada um vira um estágio com gate próprio |

### Gate padrão (vale para todos)

- Checklist em `docs/gates/E{n}.md` com todos os itens marcados.
- CI verde.
- Spec e ADRs em `docs/decisoes/` atualizados.
- `CHANGELOG` e tag no Git.
- O dono fecha o gate; o revisor (Claude) confere o diff contra o checklist antes.
- Gate reprovado trava o estágio seguinte. Mudança de escopo no meio do caminho exige um ADR.

### Dependências e paralelismo

- E1b roda junto com o E1. Depende só de o dono criar a conta na Pluggy e autorizar os bancos, o que deve ser feito logo por causa do trial.
- E2 depende do E0. E3 depende do E1 parte A, do E1b e do E2. E4 depende do E3 e do E1 parte B. E5 depende do E2, do E1 parte A e dos prints reais, e **corre em paralelo ao E3 e ao E4** (caminho rápido, ADR-0015).
- Decisões adiadas vencem no início do estágio: Q15 no E3; Q14 e Q16 no E5.

### Papéis

Detalhes em `docs/AGENTES.md`; plano em `ROADMAP.md`.

- **O dono não escreve código.** Lê os diffs, pede alterações, aprova o merge e fecha o gate.
- **Quem escreve:** `dev-backend` e `dev-frontend` (Sonnet 5.5, médio) e `fixer` (Haiku 5.5, alto), a partir de cartões de tarefa do `cto` (Opus 5.5, médio). Em regra financeira, o CTO escreve os casos de teste antes.
- **Quem confere, em cadeia:** `qa` (Haiku 5.5, alto) → `revisor` (Sonnet 5.5, alto, somente leitura, obrigatório em regra financeira, auth, banco, sincronização e segurança) → `cto` → dono.
- **`tutor`** (Haiku 5.5, alto, somente leitura): só explica ao dono o que está acontecendo. Não participa do fluxo de tarefas.
- Máximo de 3 agentes escrevendo ao mesmo tempo.

Os roteiros dos estágios são escritos no início de cada um (o do E1 é o `Fase0_roteiro.md`), para não envelhecerem.

## 18. Regras para o agente de desenvolvimento

- Não inventar APIs nem endpoints; consultar a documentação oficial (Pluggy, Google) antes de implementar integrações e marcar o que não foi verificado.
- Não assumir que uma instituição ou produto está disponível sem confirmar.
- Não armazenar credenciais no frontend nem no Git.
- Não fazer scraping bancário; não pedir senhas bancárias; não contornar autenticação.
- Usar mocks no desenvolvimento e fixtures fictícias nos testes.
- Pedir confirmação antes de mudanças destrutivas no banco.
- Preservar a separação de camadas; regra financeira só no domínio.
- Escrever testes para toda regra financeira **antes** de integrá-la.
- Documentar decisões técnicas importantes em `docs/`.
- Respeitar os termos do MeuPluggy: uso pessoal, até 5 conexões, sem uso comercial.
- Não começar um estágio sem o gate do anterior fechado; mudanças de escopo viram ADR.
- Nunca gravar dados reais (JSON bruto da Pluggy, prints, dumps) no repositório. A sondagem e os backups ficam fora do Git.

## 19. Critério de sucesso do MVP

O usuário consegue:

1. Vincular Santander e Nubank via MeuPluggy e sincronizar automaticamente.
2. Enviar prints semanais do extrato do Caju, revisar a extração e confirmar, sem duplicar transações (inclusive com prints sobrepostos).
3. Ver todas as transações num só lugar, categorizadas automaticamente e corrigíveis.
4. Ver saldo por conta com a data de atualização.
5. Ver gastos por categoria, **sem** contar transferências internas nem pagamento de fatura como despesa.
6. Saber quais fontes estão atualizadas e quais exigem ação.
7. Manter todas as credenciais fora do repositório.
8. Ver o patrimônio (contas + caixinhas) sem que dinheiro guardado conte como gasto.
9. Ver, em cada conta, se ela confere ou não com o saldo do banco.
