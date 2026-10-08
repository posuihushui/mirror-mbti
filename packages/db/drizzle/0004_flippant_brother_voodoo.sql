CREATE TABLE "comparison_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token" varchar(32) NOT NULL,
	"share_id" uuid NOT NULL,
	"visitor_id" uuid NOT NULL,
	"result_id" text NOT NULL,
	"locale" varchar(2) NOT NULL,
	"public_snapshot" jsonb NOT NULL,
	"content_version" text NOT NULL,
	"consent_version" text NOT NULL,
	"request_id" uuid NOT NULL,
	"request_hash" char(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparison_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "comparisons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"host_visitor_id" uuid NOT NULL,
	"guest_visitor_id" uuid NOT NULL,
	"guest_result_id" text NOT NULL,
	"host_snapshot" jsonb NOT NULL,
	"guest_snapshot" jsonb NOT NULL,
	"content_version" text NOT NULL,
	"locale" varchar(2) NOT NULL,
	"output_snapshot" jsonb NOT NULL,
	"guest_consent_version" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_attributions" (
	"visitor_id" uuid PRIMARY KEY NOT NULL,
	"share_id" uuid NOT NULL,
	"first_touch_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"quiz_started_at" timestamp with time zone,
	"first_result_id" text,
	"completed_at" timestamp with time zone,
	CONSTRAINT "referral_attributions_first_result_id_unique" UNIQUE("first_result_id")
);
--> statement-breakpoint
CREATE TABLE "result_shares" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token" varchar(32) NOT NULL,
	"visitor_id" uuid NOT NULL,
	"result_id" text NOT NULL,
	"request_id" uuid NOT NULL,
	"request_hash" char(64) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"content_version" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"selected_ids" text[] NOT NULL,
	"show_type" boolean NOT NULL,
	"show_dimensions" boolean NOT NULL,
	"consent_version" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "result_shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "share_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"share_id" uuid,
	"pair_id" uuid,
	"actor_visitor_id" uuid NOT NULL,
	"locale" varchar(2) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dedupe_key" text NOT NULL,
	"channel" text NOT NULL,
	"surface" text NOT NULL,
	CONSTRAINT "share_events_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "share_rate_limits" (
	"bucket_key" char(64) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD CONSTRAINT "comparison_invitations_share_id_result_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."result_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD CONSTRAINT "comparison_invitations_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_invitations" ADD CONSTRAINT "comparison_invitations_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_invitation_id_comparison_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."comparison_invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_host_visitor_id_visitors_id_fk" FOREIGN KEY ("host_visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_guest_visitor_id_visitors_id_fk" FOREIGN KEY ("guest_visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_guest_result_id_results_id_fk" FOREIGN KEY ("guest_result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_revoked_by_visitors_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_share_id_result_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."result_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_first_result_id_results_id_fk" FOREIGN KEY ("first_result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_shares" ADD CONSTRAINT "result_shares_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_shares" ADD CONSTRAINT "result_shares_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_share_id_result_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."result_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_pair_id_comparisons_id_fk" FOREIGN KEY ("pair_id") REFERENCES "public"."comparisons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_actor_visitor_id_visitors_id_fk" FOREIGN KEY ("actor_visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comparison_invitation_request_idx" ON "comparison_invitations" USING btree ("visitor_id","request_id");--> statement-breakpoint
CREATE INDEX "comparison_invitation_share_idx" ON "comparison_invitations" USING btree ("share_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comparison_invitation_guest_idx" ON "comparisons" USING btree ("invitation_id","guest_visitor_id");--> statement-breakpoint
CREATE INDEX "comparison_host_created_idx" ON "comparisons" USING btree ("host_visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "comparison_guest_created_idx" ON "comparisons" USING btree ("guest_visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "attributions_share_completed_idx" ON "referral_attributions" USING btree ("share_id","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shares_owner_request_idx" ON "result_shares" USING btree ("visitor_id","request_id");--> statement-breakpoint
CREATE INDEX "shares_owner_created_idx" ON "result_shares" USING btree ("visitor_id","created_at","id");--> statement-breakpoint
CREATE INDEX "share_events_kind_time_idx" ON "share_events" USING btree ("event_name","occurred_at");--> statement-breakpoint
CREATE INDEX "share_events_resource_actor_time_idx" ON "share_events" USING btree ("share_id","actor_visitor_id","occurred_at");