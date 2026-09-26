CREATE TABLE "invite_codes" (
	"code" varchar(8) PRIMARY KEY NOT NULL,
	"result_id" text NOT NULL,
	"visitor_id" uuid NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_result_id_unique" UNIQUE("result_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pricing" text DEFAULT 'list' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "list_amount_fen" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invite_code" varchar(8);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "join_invitation_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "join_consent_version" text;--> statement-breakpoint
-- Orders so far were all charged the list price; 请 TA orders are their own product.
UPDATE "orders" SET "pricing" = 'gift' WHERE "kind" = 'pair-gift';--> statement-breakpoint
UPDATE "orders" SET "list_amount_fen" = "amount_fen";--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invite_codes_visitor_idx" ON "invite_codes" USING btree ("visitor_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_invite_code_invite_codes_code_fk" FOREIGN KEY ("invite_code") REFERENCES "public"."invite_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_join_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("join_invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_invite_code_idx" ON "orders" USING btree ("invite_code");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pricing" CHECK ("orders"."pricing" in ('list', 'invite', 'gift'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_join_consent" CHECK (("orders"."join_invitation_id" is null) = ("orders"."join_consent_version" is null));