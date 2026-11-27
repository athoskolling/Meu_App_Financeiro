# `src/application/`: casos de uso

Camada da clean architecture entre o domínio e o mundo externo (ADR-0029). Ainda está vazia, de propósito: o primeiro módulo entra com o primeiro caso de uso real.

| Caso de uso previsto                   | Tarefa | Usa                                                              |
| -------------------------------------- | ------ | ---------------------------------------------------------------- |
| Lançamento manual                      | T2.6   | `assignIdentities` do domínio; repositório de transações (porta) |
| Sincronização Pluggy (`SyncService`)   | T3.4   | identidade, mapper; cliente Pluggy e banco (portas)              |
| Importação de prints (`ImportService`) | T5.5   | parser, mesclador; extrator e banco (portas)                     |

Regras (o lint barra, `tests/lint/camadas.test.ts`):

- pode importar `src/domain/` e outros casos de uso;
- não importa `src/infrastructure/`, `src/app/`, `src/components/`, `next`, `react`, `drizzle-orm`, `pg`, `postgres` nem `@supabase/*`;
- o que vem de fora (banco, Pluggy, relógio, extrator) chega por parâmetro, numa porta definida aqui, e a implementação fica em `src/infrastructure/`.
