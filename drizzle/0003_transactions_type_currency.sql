ALTER TABLE "transactions" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_currency_check" CHECK ("currency" IN ('BRL'));