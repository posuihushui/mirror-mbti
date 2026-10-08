ALTER TYPE "public"."payment_channel" ADD VALUE 'ethereum';--> statement-breakpoint
ALTER TYPE "public"."payment_channel" ADD VALUE 'solana';--> statement-breakpoint
ALTER TYPE "public"."payment_provider" ADD VALUE 'crypto';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payer_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "start_block" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_reference_unique" UNIQUE("payment_reference");