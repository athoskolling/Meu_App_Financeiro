# Decisões (índice)

Cada decisão relevante vira um arquivo `NNNN-titulo.md` com contexto, decisão e consequências. Este índice resume o que já foi decidido na rodada de arquitetura (detalhes na spec v2.3).

| # | Decisão | Onde na spec |
|---|---------|--------------|
| 0001 | Dinheiro em centavos inteiros; `bigint` no banco | 5.1 |
| 0002 | `amount` com sinal; adapters convertem (cartão da Pluggy chega invertido) | 5.2 |
| 0003 | Datas civis em string; mês = `date` da própria linha; `pending` do cartão entra | 5.3 |
| 0004 | Identidade = `baseKey` + ocorrência com `existingCounts` (modos `complete` e `incremental`); índice único é a garantia final | 5.4 |
| 0005 | Id da Pluggy é só dica; exclusão lógica; reconectar não duplica | 5.4 |
| 0006 | Caixinhas e investimentos como `holdings`; movimentos são `investment`, fora de gastos | 5.5, 5.9 |
| 0007 | Conferência de lacunas na Pluggy marca a conta como incompleta | 5.10 |
| 0008 | Vercel Hobby + Supabase Free; Docker-ready; VPS como plano B | 6 |
| 0009 | Drizzle só no servidor; pooler 6543 com `prepare: false`; RLS sem políticas | 6 |
| 0010 | Login só com Google; `OWNER_EMAIL`; cadastro público desligado | 14 |
| 0011 | API `/v2/transactions` da Pluggy | 8.1 |
| 0012 | Backup: export no app + dump mensal manual fora do repo | 14 |
| 0013 | CI, logs, variáveis de ambiente e política de testes | 14, 15 |
| 0014 | Entrega em estágios com gates; sem feature flags | 4.5, 17 |
| 0015 | Caminho rápido: o dono não escreve código; agentes escrevem tudo; cadeia dev → QA → revisor → CTO → dono; E1 em duas partes; mesclador de prints no E5; E5 em paralelo ao E3 e ao E4; até 3 escritores; Playwright, relatórios extras e lembrete de backup ficam na v1.x; agente `tutor` somente leitura | 17, `ROADMAP.md`, `docs/AGENTES.md` |

## Adiadas, com prazo

| # | Decisão | Vence |
|---|---------|-------|
| Q15 | Sincronização (cron diário, botão, lock em `sync_logs`, polling) | início do E3 |
| Q14 | Motor de extração dos prints (Claude × GPT-5.6 Luna, medindo) | início do E5 |
| Q16 | Recorte e compressão dos prints no cliente | início do E5 |

## A resolver na sondagem (E1b)

Sinal da conta corrente; significado de `date` no cartão; comportamento de `pending`; se as caixinhas chegam; webhooks; validade da API key.
