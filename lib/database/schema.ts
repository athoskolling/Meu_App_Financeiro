import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

// Schema do MVP (spec 10, ADR-0021). Dinheiro em bigint/centavos (modo bigint); datas civis em
// date/modo string (ADR-0018); momentos em timestamptz. Enums de texto usam text + CHECK
// (mais simples de evoluir em migração do que ALTER TYPE). RLS é ligado por SQL na migração.
// Só importável no servidor.

const id = () =>
  uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`);
const money = (name: string) => bigint(name, { mode: 'bigint' });
const moment = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const createdAt = () => moment('created_at').notNull().defaultNow();
const updatedAt = () => moment('updated_at').notNull().defaultNow();
const userId = () =>
  uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' });

const oneOf = (column: string, values: readonly string[]) =>
  sql.raw(`"${column}" IN (${values.map((v) => `'${v}'`).join(', ')})`);

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const institutions = pgTable('institutions', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type'),
  logoUrl: text('logo_url'),
  createdAt: createdAt(),
});

export const connections = pgTable(
  'connections',
  {
    id: id(),
    userId: userId(),
    provider: text('provider').notNull(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'restrict' }),
    // SEGREDO (itemId): nunca em log. Criptografia é do E3 (pendência).
    externalItemId: text('external_item_id'),
    status: text('status').notNull().default('active'),
    lastSyncAt: moment('last_sync_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('connections_provider_check', oneOf('provider', ['pluggy', 'caju_ocr'])),
    index('connections_user_id_idx').on(t.userId),
    index('connections_institution_id_idx').on(t.institutionId),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    userId: userId(),
    connectionId: uuid('connection_id').references(() => connections.id, { onDelete: 'restrict' }),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'restrict' }),
    externalAccountId: text('external_account_id'),
    name: text('name').notNull(),
    type: text('type').notNull(),
    currency: text('currency').notNull().default('BRL'),
    balance: money('balance'),
    availableBalance: money('available_balance'),
    balanceSource: text('balance_source'),
    balanceUpdatedAt: moment('balance_updated_at'),
    reconciliationStatus: text('reconciliation_status').notNull().default('unknown'),
    reconciliationDiff: money('reconciliation_diff'),
    maskedNumber: text('masked_number'),
    status: text('status').notNull().default('active'),
    lastSyncAt: moment('last_sync_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      'accounts_type_check',
      oneOf('type', ['checking', 'savings', 'credit_card', 'benefit', 'investment', 'other']),
    ),
    check(
      'accounts_reconciliation_status_check',
      oneOf('reconciliation_status', ['ok', 'gap', 'unknown']),
    ),
    index('accounts_user_id_idx').on(t.userId),
    index('accounts_connection_id_idx').on(t.connectionId),
    index('accounts_institution_id_idx').on(t.institutionId),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),
    icon: text('icon'),
    color: text('color'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('categories_user_id_idx').on(t.userId),
    index('categories_parent_id_idx').on(t.parentId),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    userId: userId(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    externalTransactionId: text('external_transaction_id'),
    identityKey: text('identity_key').notNull(),
    source: text('source').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    postedAt: moment('posted_at'),
    description: text('description').notNull(),
    merchantName: text('merchant_name'),
    amount: money('amount').notNull(),
    currency: text('currency').notNull().default('BRL'),
    type: text('type'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('posted'),
    isTransfer: boolean('is_transfer').notNull().default(false),
    transferPairId: uuid('transfer_pair_id'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    metadata: jsonb('metadata'),
    deletedAt: moment('deleted_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('transactions_account_identity_key_uq').on(t.accountId, t.identityKey),
    check('transactions_source_check', oneOf('source', ['open_finance', 'caju_ocr', 'manual'])),
    check('transactions_status_check', oneOf('status', ['pending', 'posted'])),
    index('transactions_account_id_date_idx').on(t.accountId, t.date),
    index('transactions_user_id_date_idx').on(t.userId, t.date),
    index('transactions_category_id_idx').on(t.categoryId),
    index('transactions_transfer_pair_id_idx').on(t.transferPairId),
  ],
);

export const merchantRules = pgTable(
  'merchant_rules',
  {
    id: id(),
    userId: userId(),
    merchantPattern: text('merchant_pattern').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('merchant_rules_user_id_idx').on(t.userId),
    index('merchant_rules_category_id_idx').on(t.categoryId),
  ],
);

export const imports = pgTable(
  'imports',
  {
    id: id(),
    userId: userId(),
    source: text('source').notNull(),
    filename: text('filename'),
    fileHash: text('file_hash'),
    imageHashes: jsonb('image_hashes'),
    capturedAt: moment('captured_at'),
    extractor: text('extractor'),
    periodStart: date('period_start', { mode: 'string' }),
    periodEnd: date('period_end', { mode: 'string' }),
    totalRows: integer('total_rows').notNull().default(0),
    importedRows: integer('imported_rows').notNull().default(0),
    duplicateRows: integer('duplicate_rows').notNull().default(0),
    errorRows: integer('error_rows').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('imports_user_id_idx').on(t.userId)],
);

export const importItems = pgTable(
  'import_items',
  {
    id: id(),
    importId: uuid('import_id')
      .notNull()
      .references(() => imports.id, { onDelete: 'restrict' }),
    imageIndex: integer('image_index'),
    rowIndex: integer('row_index'),
    rawText: text('raw_text'),
    parsedDate: date('parsed_date', { mode: 'string' }),
    parsedAmount: money('parsed_amount'),
    parsedDescription: text('parsed_description'),
    confidence: integer('confidence'),
    status: text('status').notNull().default('pending'),
    transactionId: uuid('transaction_id').references(() => transactions.id, {
      onDelete: 'restrict',
    }),
  },
  (t) => [
    check(
      'import_items_status_check',
      oneOf('status', ['pending', 'confirmed', 'edited', 'rejected']),
    ),
    index('import_items_import_id_idx').on(t.importId),
    index('import_items_transaction_id_idx').on(t.transactionId),
  ],
);

export const holdings = pgTable(
  'holdings',
  {
    id: id(),
    userId: userId(),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => connections.id, { onDelete: 'restrict' }),
    externalId: text('external_id'),
    name: text('name').notNull(),
    type: text('type'),
    balance: money('balance').notNull(),
    currency: text('currency').notNull().default('BRL'),
    balanceUpdatedAt: moment('balance_updated_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('holdings_user_id_idx').on(t.userId),
    index('holdings_connection_id_idx').on(t.connectionId),
  ],
);

export const syncLogs = pgTable(
  'sync_logs',
  {
    id: id(),
    userId: userId(),
    connectionId: uuid('connection_id').references(() => connections.id, { onDelete: 'restrict' }),
    startedAt: moment('started_at').notNull().defaultNow(),
    finishedAt: moment('finished_at'),
    status: text('status').notNull().default('running'),
    lockExpiresAt: moment('lock_expires_at'),
    accountsSynced: integer('accounts_synced').notNull().default(0),
    transactionsSynced: integer('transactions_synced').notNull().default(0),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata'),
  },
  (t) => [
    check('sync_logs_status_check', oneOf('status', ['running', 'ok', 'error'])),
    index('sync_logs_user_id_idx').on(t.userId),
    index('sync_logs_connection_id_idx').on(t.connectionId),
  ],
);
