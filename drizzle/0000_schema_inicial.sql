CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_id" uuid,
	"institution_id" uuid NOT NULL,
	"external_account_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"balance" bigint,
	"available_balance" bigint,
	"balance_source" text,
	"balance_updated_at" timestamp with time zone,
	"reconciliation_status" text DEFAULT 'unknown' NOT NULL,
	"reconciliation_diff" bigint,
	"masked_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_type_check" CHECK ("type" IN ('checking', 'savings', 'credit_card', 'benefit', 'investment', 'other')),
	CONSTRAINT "accounts_reconciliation_status_check" CHECK ("reconciliation_status" IN ('ok', 'gap', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"icon" text,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"institution_id" uuid NOT NULL,
	"external_item_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connections_provider_check" CHECK ("provider" IN ('pluggy', 'caju_ocr'))
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"type" text,
	"balance" bigint NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"balance_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"image_index" integer,
	"row_index" integer,
	"raw_text" text,
	"parsed_date" date,
	"parsed_amount" bigint,
	"parsed_description" text,
	"confidence" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" uuid,
	CONSTRAINT "import_items_status_check" CHECK ("status" IN ('pending', 'confirmed', 'edited', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text NOT NULL,
	"filename" text,
	"file_hash" text,
	"image_hashes" jsonb,
	"captured_at" timestamp with time zone,
	"extractor" text,
	"period_start" date,
	"period_end" date,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"imported_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "merchant_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"merchant_pattern" text NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"lock_expires_at" timestamp with time zone,
	"accounts_synced" integer DEFAULT 0 NOT NULL,
	"transactions_synced" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	CONSTRAINT "sync_logs_status_check" CHECK ("status" IN ('running', 'ok', 'error'))
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"external_transaction_id" text,
	"identity_key" text NOT NULL,
	"source" text NOT NULL,
	"date" date NOT NULL,
	"posted_at" timestamp with time zone,
	"description" text NOT NULL,
	"merchant_name" text,
	"amount" bigint NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"type" text,
	"category_id" uuid,
	"status" text DEFAULT 'posted' NOT NULL,
	"is_transfer" boolean DEFAULT false NOT NULL,
	"transfer_pair_id" uuid,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_source_check" CHECK ("source" IN ('open_finance', 'caju_ocr', 'manual')),
	CONSTRAINT "transactions_status_check" CHECK ("status" IN ('pending', 'posted'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_rules" ADD CONSTRAINT "merchant_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_rules" ADD CONSTRAINT "merchant_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_connection_id_idx" ON "accounts" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "accounts_institution_id_idx" ON "accounts" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "connections_user_id_idx" ON "connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connections_institution_id_idx" ON "connections" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "holdings_user_id_idx" ON "holdings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "holdings_connection_id_idx" ON "holdings" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "import_items_import_id_idx" ON "import_items" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "import_items_transaction_id_idx" ON "import_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "imports_user_id_idx" ON "imports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "merchant_rules_user_id_idx" ON "merchant_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "merchant_rules_category_id_idx" ON "merchant_rules" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "sync_logs_user_id_idx" ON "sync_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_logs_connection_id_idx" ON "sync_logs" USING btree ("connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_account_identity_key_uq" ON "transactions" USING btree ("account_id","identity_key");--> statement-breakpoint
CREATE INDEX "transactions_account_id_date_idx" ON "transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "transactions_user_id_date_idx" ON "transactions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_transfer_pair_id_idx" ON "transactions" USING btree ("transfer_pair_id");