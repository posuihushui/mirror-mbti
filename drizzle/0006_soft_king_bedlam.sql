CREATE TABLE "comparison_continuations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"result_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comparison_invitations" ALTER COLUMN "share_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_attributions" ALTER COLUMN "share_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD COLUMN "access_policy" text DEFAULT 'legacy-free-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "access_policy" text DEFAULT 'legacy-free-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD COLUMN "invitation_id" uuid;--> statement-breakpoint
ALTER TABLE "share_events" ADD COLUMN "invitation_id" uuid;--> statement-breakpoint
ALTER TABLE "share_events" ADD COLUMN "owner_result_id" text;--> statement-breakpoint
ALTER TABLE "share_events" ADD COLUMN "eligibility_at_event" text;--> statement-breakpoint
ALTER TABLE "share_events" ADD COLUMN "rule_version" text DEFAULT 'first-touch-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "comparison_continuations" ADD CONSTRAINT "comparison_continuations_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_continuations" ADD CONSTRAINT "comparison_continuations_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_continuations" ADD CONSTRAINT "comparison_continuations_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "continuations_owner_invitation_result_idx" ON "comparison_continuations" USING btree ("visitor_id","invitation_id","result_id");--> statement-breakpoint
CREATE INDEX "continuations_owner_result_idx" ON "comparison_continuations" USING btree ("visitor_id","result_id");--> statement-breakpoint
CREATE INDEX "continuations_expiry_idx" ON "comparison_continuations" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_owner_result_id_results_id_fk" FOREIGN KEY ("owner_result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comparison_invitation_result_idx" ON "comparison_invitations" USING btree ("result_id","created_at");--> statement-breakpoint
CREATE INDEX "attributions_invitation_completed_idx" ON "referral_attributions" USING btree ("invitation_id","completed_at");--> statement-breakpoint
CREATE INDEX "share_events_invitation_time_idx" ON "share_events" USING btree ("invitation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "share_events_owner_result_time_idx" ON "share_events" USING btree ("owner_result_id","occurred_at");--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD CONSTRAINT "invitation_access_policy" CHECK ("comparison_invitations"."access_policy" in ('legacy-free-v1', 'paid-pair-v2'));--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparison_access_policy" CHECK ("comparisons"."access_policy" in ('legacy-free-v1', 'paid-pair-v2'));--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "attributions_one_source" CHECK (num_nonnulls("referral_attributions"."share_id", "referral_attributions"."invitation_id") = 1);--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_one_source" CHECK (num_nonnulls("share_events"."share_id", "share_events"."invitation_id") <= 1);--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_eligibility" CHECK ("share_events"."eligibility_at_event" in ('eligible', 'locked', 'unavailable', 'syncing'));
--> statement-breakpoint
ALTER TABLE "comparison_invitations" ALTER COLUMN "access_policy" SET DEFAULT 'paid-pair-v2';
--> statement-breakpoint
ALTER TABLE "comparisons" ALTER COLUMN "access_policy" SET DEFAULT 'paid-pair-v2';
