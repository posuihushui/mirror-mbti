CREATE TABLE "pair_gifts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"visitor_id" uuid NOT NULL,
	"locale" varchar(2) NOT NULL,
	"invitation_id" uuid,
	"claimed_at" timestamp with time zone,
	"claimed_visitor_id" uuid,
	"claimed_result_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pair_gifts_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "pair_gifts_claimed_result_id_unique" UNIQUE("claimed_result_id"),
	CONSTRAINT "pair_gifts_claim" CHECK (("pair_gifts"."claimed_at" is null) = ("pair_gifts"."claimed_result_id" is null) and ("pair_gifts"."claimed_at" is null) = ("pair_gifts"."claimed_visitor_id" is null))
);
--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD COLUMN "relationship" text;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "relationship" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "kind" text DEFAULT 'report' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invitation_id" uuid;--> statement-breakpoint
ALTER TABLE "pair_gifts" ADD CONSTRAINT "pair_gifts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_gifts" ADD CONSTRAINT "pair_gifts_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_gifts" ADD CONSTRAINT "pair_gifts_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_gifts" ADD CONSTRAINT "pair_gifts_claimed_visitor_id_visitors_id_fk" FOREIGN KEY ("claimed_visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_gifts" ADD CONSTRAINT "pair_gifts_claimed_result_id_results_id_fk" FOREIGN KEY ("claimed_result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pair_gifts_open_invitation_idx" ON "pair_gifts" USING btree ("invitation_id") WHERE "pair_gifts"."claimed_at" is null;--> statement-breakpoint
CREATE INDEX "pair_gifts_owner_idx" ON "pair_gifts" USING btree ("visitor_id","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD CONSTRAINT "invitation_relationship" CHECK ("comparison_invitations"."relationship" in ('partner', 'friend', 'family', 'colleague'));--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparison_relationship" CHECK ("comparisons"."relationship" in ('partner', 'friend', 'family', 'colleague'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_kind" CHECK ("orders"."kind" in ('report', 'pair-gift'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_gift_invitation" CHECK (("orders"."kind" = 'pair-gift') = ("orders"."invitation_id" is not null));