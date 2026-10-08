ALTER TABLE "results" ADD COLUMN "questionnaire_id" text DEFAULT 'legacy32-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "question_count" integer DEFAULT 32 NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "responses" jsonb;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "scoring_version" text DEFAULT 'preference-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "report_version" text DEFAULT 'context-v2' NOT NULL;