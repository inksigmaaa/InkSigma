DROP INDEX "blog_publication_published_created_idx";--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "publishedAt" timestamp;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "scheduledFor" timestamp;--> statement-breakpoint
UPDATE "blog"
SET
	"status" = CASE
		WHEN "published" THEN 'published'
		ELSE 'draft'
	END,
	"publishedAt" = CASE
		WHEN "published" THEN COALESCE("updatedAt", "createdAt")
		ELSE NULL
	END;--> statement-breakpoint
CREATE INDEX "blog_publication_status_created_idx" ON "blog" USING btree ("publicationId","status","createdAt");
