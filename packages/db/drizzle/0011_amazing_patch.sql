CREATE TABLE "admin_login_attempts" (
	"bucket" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "browser_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"path" varchar(80) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"device" varchar(12) NOT NULL,
	"referrer_host" varchar(253),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "browser_events" ADD CONSTRAINT "browser_events_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "browser_events_created_idx" ON "browser_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "browser_events_visitor_created_idx" ON "browser_events" USING btree ("visitor_id","created_at");