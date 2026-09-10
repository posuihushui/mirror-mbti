CREATE TYPE "public"."order_status" AS ENUM('created', 'paid', 'cancelled', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_channel" AS ENUM('mock', 'jsapi', 'native', 'h5');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('mock', 'wechat');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"result_id" text NOT NULL,
	"amount_fen" integer NOT NULL,
	"currency" char(3) DEFAULT 'CNY' NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"channel" "payment_channel" NOT NULL,
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"provider_txn_id" text,
	"prepay_payload" jsonb,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text,
	"provider" "payment_provider" NOT NULL,
	"event_id" text,
	"kind" text NOT NULL,
	"raw" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"type" char(4) NOT NULL,
	"values" integer[] NOT NULL,
	"balanced" boolean[] NOT NULL,
	"unlocked_at" timestamp with time zone,
	"unlock_order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wechat_openid" text,
	"user_agent" text,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_visitor_created_idx" ON "orders" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_result_status_idx" ON "orders" USING btree ("result_id","status");--> statement-breakpoint
CREATE INDEX "results_visitor_created_idx" ON "results" USING btree ("visitor_id","created_at");