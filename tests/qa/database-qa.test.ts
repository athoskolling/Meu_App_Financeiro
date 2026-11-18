// QA independente da T2.2 (schema Drizzle, migrações e RLS). Dados sintéticos, únicos por execução
// (randomUUID). Sem URL, senha ou valor de variável no código.
// Integração: exige um Postgres com banco VAZIO em TEST_DATABASE_URL; sem a variável o describe é
// pulado com motivo (mesma regra do teste de integração do dev).
// Os achados são it.fails: passam enquanto a falha existe e viram vermelho quando o comportamento
// mudar (aí o it.fails deve virar it). Não alterar os testes do dev aqui.
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

const TABELAS = [
  'users',
  'institutions',
  'connections',
  'accounts',
  'transactions',
  'categories',
  'merchant_rules',
  'imports',
  'import_items',
  'holdings',
  'sync_logs',
] as const;

/** Lê o id da primeira linha de um RETURNING id; falha alto se a consulta não devolveu nada. */
function idDe(linhas: readonly { id?: unknown }[]): string {
  const v = linhas[0]?.id;
  if (typeof v !== 'string') throw new Error('consulta não devolveu id');
  return v;
}

describe.skipIf(!url)(
  'QA T2.2: schema, enums, FKs e RLS num Postgres real (requer TEST_DATABASE_URL)',
  () => {
    const conexao = postgres(url ?? 'postgresql://invalido', { prepare: false, max: 1 });

    // Este arquivo NÃO migra. Migrar aqui, em paralelo com a integração do dev (que migra), faz
    // dois CREATE TABLE concorrentes e um deles quebra (medido: 4 de 5 rodadas em banco vazio).
    // Só espera o schema completo, que o drizzle aplica numa transação só. Para rodar sozinho em
    // banco vazio, rode `pnpm db:migrate` antes.
    beforeAll(async () => {
      const limite = Date.now() + 20_000;
      while (Date.now() < limite) {
        const [r] = await conexao`
          SELECT count(*)::int AS n FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ANY(${[...TABELAS]})`;
        if (Number(r?.n) === TABELAS.length) return;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      throw new Error(
        'schema ausente: aplique as migrações (pnpm db:migrate) ou rode junto com a integração do dev',
      );
    }, 30_000);

    afterAll(async () => {
      await conexao.end();
    });

    async function usuarioInstituicao(): Promise<{ userId: string; institutionId: string }> {
      const s = randomUUID();
      const userId = idDe(
        await conexao`INSERT INTO users (email) VALUES (${`qa-${s}@example.com`}) RETURNING id`,
      );
      const institutionId = idDe(
        await conexao`INSERT INTO institutions (name, slug)
        VALUES ('Instituição sintética', ${`qa-inst-${s}`}) RETURNING id`,
      );
      return { userId, institutionId };
    }

    async function contaNova(userId: string, institutionId: string): Promise<string> {
      return idDe(
        await conexao`INSERT INTO accounts (user_id, institution_id, name, type)
        VALUES (${userId}, ${institutionId}, 'Conta sintética', 'checking') RETURNING id`,
      );
    }

    async function cenario(): Promise<{
      userId: string;
      institutionId: string;
      accountId: string;
    }> {
      const { userId, institutionId } = await usuarioInstituicao();
      const accountId = await contaNova(userId, institutionId);
      return { userId, institutionId, accountId };
    }

    /** Insere uma transação sintética. Valores padrão válidos; `identityKey: null` é mantido como null. */
    function inserirTransacao(c: {
      userId: string;
      accountId: string;
      identityKey?: string | null;
      amount?: string;
      date?: string;
      source?: string;
      status?: string;
      type?: string | null;
    }) {
      const {
        userId,
        accountId,
        identityKey = 'chave-1',
        amount = '-1000',
        date = '2026-01-15',
        source = 'manual',
        status = 'posted',
        type = null,
      } = c;
      return conexao`
      INSERT INTO transactions
        (user_id, account_id, identity_key, source, date, description, amount, status, type)
      VALUES
        (${userId}, ${accountId}, ${identityKey}, ${source}, ${date}, 'Descrição sintética',
         ${amount}, ${status}, ${type})
      RETURNING id`;
    }

    describe('identity_key', () => {
      it('identity_key NULL é recusada (23502 not_null_violation)', async () => {
        const c = await cenario();
        await expect(inserirTransacao({ ...c, identityKey: null })).rejects.toMatchObject({
          code: '23502',
        });
      });

      it('a mesma identity_key em contas diferentes é permitida', async () => {
        const { userId, institutionId, accountId } = await cenario();
        const outraConta = await contaNova(userId, institutionId);
        await expect(
          inserirTransacao({ userId, accountId, identityKey: 'compartilhada' }),
        ).resolves.toHaveLength(1);
        await expect(
          inserirTransacao({ userId, accountId: outraConta, identityKey: 'compartilhada' }),
        ).resolves.toHaveLength(1);
      });

      it('a mesma identity_key na mesma conta é recusada (23505)', async () => {
        const c = await cenario();
        await inserirTransacao({ ...c, identityKey: 'repetida' });
        await expect(inserirTransacao({ ...c, identityKey: 'repetida' })).rejects.toMatchObject({
          code: '23505',
        });
      });
    });

    describe('amount (bigint, centavos com sinal)', () => {
      it.each([
        '2147483648',
        '-2147483649',
        '9007199254740991',
        '-9007199254740991',
        '9223372036854775807',
        '-9223372036854775808',
      ])('aceita %s e devolve o mesmo valor (sem arredondar)', async (valor) => {
        const c = await cenario();
        const id = idDe(await inserirTransacao({ ...c, amount: valor }));
        const linhas =
          await conexao`SELECT amount::text AS amount FROM transactions WHERE id = ${id}`;
        expect(linhas[0]?.amount).toBe(valor);
      });

      it('acima do limite do bigint é recusado (22003 numeric_value_out_of_range)', async () => {
        const c = await cenario();
        await expect(
          inserirTransacao({ ...c, amount: '9223372036854775808' }),
        ).rejects.toMatchObject({ code: '22003' });
      });

      it('amount NULL é recusado (23502)', async () => {
        const c = await cenario();
        await expect(
          conexao`INSERT INTO transactions (user_id, account_id, identity_key, source, date, description, amount)
          VALUES (${c.userId}, ${c.accountId}, 'nula', 'manual', '2026-01-15', 'x', NULL)`,
        ).rejects.toMatchObject({ code: '23502' });
      });
    });

    describe('datas civis (type date)', () => {
      it('aceita 29/02 em ano bissexto (2028) e recusa 29/02 em ano comum (22008)', async () => {
        const c = await cenario();
        await expect(
          inserirTransacao({ ...c, date: '2028-02-29', identityKey: 'bissexto' }),
        ).resolves.toHaveLength(1);
        await expect(
          inserirTransacao({ ...c, date: '2026-02-29', identityKey: 'nao-bissexto' }),
        ).rejects.toMatchObject({ code: '22008' });
      });

      it('a data volta como a mesma string civil, sem deslocamento de fuso', async () => {
        const c = await cenario();
        const id = idDe(
          await inserirTransacao({ ...c, date: '2026-01-01', identityKey: 'primeiro-dia' }),
        );
        const [linha] = await conexao`SELECT date::text AS d FROM transactions WHERE id = ${id}`;
        expect(linha?.d).toBe('2026-01-01');
      });
    });

    describe('CHECK dos enums', () => {
      it('connections.provider recusa valor fora de pluggy/caju_ocr (23514)', async () => {
        const { userId, institutionId } = await usuarioInstituicao();
        await expect(
          conexao`INSERT INTO connections (user_id, provider, institution_id) VALUES (${userId}, 'outro', ${institutionId})`,
        ).rejects.toMatchObject({ code: '23514' });
      });

      it('accounts.type recusa valor fora da lista da spec 10 (23514)', async () => {
        const { userId, institutionId } = await usuarioInstituicao();
        await expect(
          conexao`INSERT INTO accounts (user_id, institution_id, name, type) VALUES (${userId}, ${institutionId}, 'x', 'poupanca_inventada')`,
        ).rejects.toMatchObject({ code: '23514' });
      });

      it('accounts.reconciliation_status recusa valor fora de ok/gap/unknown (23514)', async () => {
        const { userId, institutionId } = await usuarioInstituicao();
        await expect(
          conexao`INSERT INTO accounts (user_id, institution_id, name, type, reconciliation_status)
          VALUES (${userId}, ${institutionId}, 'x', 'checking', 'talvez')`,
        ).rejects.toMatchObject({ code: '23514' });
      });

      it('transactions.source recusa valor fora de open_finance/caju_ocr/manual (23514)', async () => {
        const c = await cenario();
        await expect(
          inserirTransacao({ ...c, source: 'fita', identityKey: 'src' }),
        ).rejects.toMatchObject({
          code: '23514',
        });
      });

      it('transactions.status recusa valor fora de pending/posted (23514)', async () => {
        const c = await cenario();
        await expect(
          inserirTransacao({ ...c, status: 'draft', identityKey: 'st' }),
        ).rejects.toMatchObject({
          code: '23514',
        });
      });

      it('import_items.status recusa valor fora de pending/confirmed/edited/rejected (23514)', async () => {
        const { userId } = await usuarioInstituicao();
        const importId = idDe(
          await conexao`INSERT INTO imports (user_id, source) VALUES (${userId}, 'caju_ocr') RETURNING id`,
        );
        await expect(
          conexao`INSERT INTO import_items (import_id, status) VALUES (${importId}, 'aprovado')`,
        ).rejects.toMatchObject({ code: '23514' });
      });

      it('sync_logs.status recusa valor fora de running/ok/error (23514)', async () => {
        const { userId } = await usuarioInstituicao();
        await expect(
          conexao`INSERT INTO sync_logs (user_id, status) VALUES (${userId}, 'parado')`,
        ).rejects.toMatchObject({ code: '23514' });
      });

      it('os valores válidos de transactions.source e status são aceitos', async () => {
        const c = await cenario();
        for (const [i, source] of ['open_finance', 'caju_ocr', 'manual'].entries()) {
          await expect(
            inserirTransacao({ ...c, source, identityKey: `src-${i}` }),
          ).resolves.toHaveLength(1);
        }
        await expect(
          inserirTransacao({ ...c, status: 'pending', identityKey: 'pend' }),
        ).resolves.toHaveLength(1);
      });

      it('transactions.type aceita os 8 valores da spec 5.2', async () => {
        const c = await cenario();
        const tipos = [
          'income',
          'expense',
          'transfer',
          'credit_card_purchase',
          'credit_card_payment',
          'refund',
          'investment',
          'other',
        ];
        for (const [i, type] of tipos.entries()) {
          await expect(
            inserirTransacao({ ...c, type, identityKey: `tipo-${i}` }),
          ).resolves.toHaveLength(1);
        }
      });

      // BUG-T2.2-QA-01: a spec 5.2 enumera os 8 valores de `type`, mas a coluna é text livre
      // (sem CHECK). O dev registrou que "a spec não lista valores", o que não é verdade.
      it.fails(
        'BUG-T2.2-QA-01: transactions.type recusa valor fora dos 8 da spec 5.2 (23514)',
        async () => {
          const c = await cenario();
          await expect(
            inserirTransacao({ ...c, type: 'valor_inventado', identityKey: 'tipo-invalido' }),
          ).rejects.toMatchObject({ code: '23514' });
        },
      );
    });

    describe('FKs e ON DELETE RESTRICT', () => {
      it('transação com account_id inexistente é recusada (23503)', async () => {
        const c = await cenario();
        await expect(
          inserirTransacao({ ...c, accountId: randomUUID(), identityKey: 'conta-fantasma' }),
        ).rejects.toMatchObject({ code: '23503' });
      });

      it('transação com user_id inexistente é recusada (23503)', async () => {
        const c = await cenario();
        await expect(
          inserirTransacao({ ...c, userId: randomUUID(), identityKey: 'usuario-fantasma' }),
        ).rejects.toMatchObject({ code: '23503' });
      });

      it('apagar conta que tem transações é recusado pela FK (ON DELETE RESTRICT, 23503)', async () => {
        // Medido: RESTRICT devolve 23503 (foreign_key_violation), não 23001.
        const c = await cenario();
        await inserirTransacao({ ...c, identityKey: 'presa' });
        const erro: unknown = await conexao`DELETE FROM accounts WHERE id = ${c.accountId}`.then(
          () => null,
          (e: unknown) => e,
        );
        expect(erro).toMatchObject({ code: '23503' });
        expect(String((erro as Error).message)).toMatch(/foreign key/);
      });

      // RISCO-T2.2-QA-02 (não é regra explícita da spec 10): nada impede que uma transação de um
      // usuário aponte para a conta de outro, porque as FKs são simples e não compostas com user_id.
      // Com RLS sem políticas e acesso só pelo servidor, o risco fica para o repositório (T2.6).
      it.fails(
        'RISCO-T2.2-QA-02: transação não aponta para conta de outro usuário (23503)',
        async () => {
          const dono = await cenario();
          const intruso = await usuarioInstituicao();
          await expect(
            inserirTransacao({
              userId: intruso.userId,
              accountId: dono.accountId,
              identityKey: 'cruzada',
            }),
          ).rejects.toMatchObject({ code: '23503' });
        },
      );
    });

    describe('exclusão lógica e unicidade', () => {
      it('linha com deleted_at preenchido continua ocupando (account_id, identity_key) (literal da spec 10)', async () => {
        // A spec 10 manda índice único simples em (account_id, identity_key). Por isso uma transação
        // apagada logicamente ainda bloqueia a reinserção da mesma chave. Isto documenta o efeito
        // literal; se o CTO decidir índice parcial (deleted_at IS NULL), este teste muda de propósito.
        const c = await cenario();
        const id = idDe(await inserirTransacao({ ...c, identityKey: 'apagada' }));
        await conexao`UPDATE transactions SET deleted_at = now() WHERE id = ${id}`;
        await expect(inserirTransacao({ ...c, identityKey: 'apagada' })).rejects.toMatchObject({
          code: '23505',
        });
      });
    });

    describe('RLS: papel sem privilégios especiais (anon_teste)', () => {
      beforeAll(async () => {
        await conexao.unsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon_teste') THEN
            CREATE ROLE anon_teste NOLOGIN;
          END IF;
        END $$;`);
        await conexao.unsafe('GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon_teste');

        // Semeia pelo menos uma linha em CADA uma das 11 tabelas, como superusuário (que ignora RLS).
        // Assim o zero que o anon lê não pode ser "tabela vazia".
        const { userId, institutionId, accountId } = await cenario();
        const connectionId = idDe(
          await conexao`INSERT INTO connections (user_id, provider, institution_id)
          VALUES (${userId}, 'pluggy', ${institutionId}) RETURNING id`,
        );
        const categoryId = idDe(
          await conexao`INSERT INTO categories (user_id, name) VALUES (${userId}, 'Categoria sintética') RETURNING id`,
        );
        await conexao`INSERT INTO merchant_rules (user_id, merchant_pattern, category_id)
        VALUES (${userId}, 'padrao-sintetico', ${categoryId})`;
        const transactionId = idDe(
          await inserirTransacao({ userId, accountId, identityKey: 'rls-1' }),
        );
        const importId = idDe(
          await conexao`INSERT INTO imports (user_id, source) VALUES (${userId}, 'caju_ocr') RETURNING id`,
        );
        await conexao`INSERT INTO import_items (import_id, status, transaction_id)
        VALUES (${importId}, 'confirmed', ${transactionId})`;
        await conexao`INSERT INTO holdings (user_id, connection_id, name, balance)
        VALUES (${userId}, ${connectionId}, 'Caixinha sintética', 100)`;
        await conexao`INSERT INTO sync_logs (user_id, connection_id, status)
        VALUES (${userId}, ${connectionId}, 'ok')`;
      });

      it('anon_teste não é superusuário nem tem BYPASSRLS', async () => {
        const [papel] = await conexao`
        SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'anon_teste'`;
        expect(papel).toMatchObject({ rolsuper: false, rolbypassrls: false });
      });

      it('controle: como superusuário, as 11 tabelas têm linha', async () => {
        for (const t of TABELAS) {
          const [r] = await conexao.unsafe(`SELECT count(*)::int AS n FROM "${t}"`);
          expect(Number(r?.n), t).toBeGreaterThan(0);
        }
      });

      it('com linhas inseridas, anon_teste lê zero linhas em cada uma das 11 tabelas', async () => {
        const contagens = await conexao.begin(async (tx) => {
          await tx.unsafe('SET LOCAL ROLE anon_teste');
          const [quem] = await tx`SELECT current_user AS quem`;
          expect(quem?.quem).toBe('anon_teste');
          const resultado: Record<string, number> = {};
          for (const t of TABELAS) {
            const [r] = await tx.unsafe(`SELECT count(*)::int AS n FROM "${t}"`);
            resultado[t] = Number(r?.n);
          }
          return resultado;
        });
        for (const t of TABELAS) expect(contagens[t], t).toBe(0);
      });

      it('anon_teste também não lê uma linha pelo id (transactions)', async () => {
        const c = await cenario();
        const id = idDe(await inserirTransacao({ ...c, identityKey: 'por-id' }));
        const achou = await conexao.begin(async (tx) => {
          await tx.unsafe('SET LOCAL ROLE anon_teste');
          return tx`SELECT id FROM transactions WHERE id = ${id}`;
        });
        expect(achou).toHaveLength(0);
      });
    });
  },
);
