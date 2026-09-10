CREATE TABLE "recovery_attempts" (
	"bucket_key" char(64) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "recovery_attempts_window_idx" ON "recovery_attempts" USING btree ("window_started_at");