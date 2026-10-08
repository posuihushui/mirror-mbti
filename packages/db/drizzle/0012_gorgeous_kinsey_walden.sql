CREATE TABLE "telegram_outbox" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_outbox" ADD CONSTRAINT "telegram_outbox_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_outbox_order_status_idx" ON "telegram_outbox" USING btree ("order_id","status");--> statement-breakpoint
CREATE INDEX "telegram_outbox_pending_idx" ON "telegram_outbox" USING btree ("delivered_at","next_attempt_at");
--> statement-breakpoint
CREATE FUNCTION mirror_queue_telegram_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO telegram_outbox (order_id, status) VALUES (NEW.id, NEW.status::text) ON CONFLICT DO NOTHING;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO telegram_outbox (order_id, status) VALUES (NEW.id, NEW.status::text) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER mirror_telegram_order_insert AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION mirror_queue_telegram_order();
--> statement-breakpoint
CREATE TRIGGER mirror_telegram_order_status AFTER UPDATE OF status ON orders FOR EACH ROW EXECUTE FUNCTION mirror_queue_telegram_order();
