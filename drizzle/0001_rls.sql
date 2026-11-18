-- RLS em todas as tabelas, SEM politicas (spec 6 e 10, ADR-0021): nega tudo a anon e authenticated.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "institutions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "institutions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "connections" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "accounts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "transactions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "merchant_rules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "merchant_rules" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "imports" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "imports" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "import_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "import_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "holdings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "holdings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sync_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sync_logs" FORCE ROW LEVEL SECURITY;
