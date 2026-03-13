ALTER TABLE "blog" ADD COLUMN "publicationId" integer;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "publicationId" integer;--> statement-breakpoint

INSERT INTO "publication" ("name", "subdomain", "description", "image", "userId")
SELECT
	COALESCE(NULLIF(u."name", ''), 'My Publication'),
	CONCAT(
		regexp_replace(split_part(u."email", '@', 1), '[^a-z0-9]', '', 'g'),
		'-',
		left(u."id", 6)
	),
	NULL,
	u."image",
	u."id"
FROM "user" u
WHERE EXISTS (
	SELECT 1
	FROM "blog" b
	WHERE b."authorId" = u."id"
)
AND NOT EXISTS (
	SELECT 1
	FROM "publication" p
	WHERE p."userId" = u."id"
);--> statement-breakpoint

WITH "ranked_publications" AS (
	SELECT
		p."id",
		p."userId",
		row_number() OVER (
			PARTITION BY p."userId"
			ORDER BY p."createdAt" ASC, p."id" ASC
		) AS "publication_rank"
	FROM "publication" p
)
UPDATE "blog" b
SET "publicationId" = rp."id"
FROM "ranked_publications" rp
WHERE b."authorId" = rp."userId"
AND rp."publication_rank" = 1;--> statement-breakpoint

UPDATE "comment" c
SET "publicationId" = b."publicationId"
FROM "blog" b
WHERE c."blogId" = b."id";--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "blog"
		WHERE "publicationId" IS NULL
	) THEN
		RAISE EXCEPTION 'Unable to backfill blog.publicationId for all rows';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "comment"
		WHERE "publicationId" IS NULL
	) THEN
		RAISE EXCEPTION 'Unable to backfill comment.publicationId for all rows';
	END IF;
END $$;--> statement-breakpoint

DELETE FROM "publication" p
USING (
	SELECT "id"
	FROM (
		SELECT
			p."id",
			row_number() OVER (
				PARTITION BY p."userId"
				ORDER BY p."createdAt" ASC, p."id" ASC
			) AS "publication_rank"
		FROM "publication" p
	) ranked_publications
	WHERE "publication_rank" > 1
) duplicate_publications
WHERE p."id" = duplicate_publications."id";--> statement-breakpoint

ALTER TABLE "blog" ALTER COLUMN "publicationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "publicationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" DROP CONSTRAINT "blog_slug_unique";--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_publication_slug_unique" ON "blog" USING btree ("publicationId", "slug");--> statement-breakpoint
CREATE INDEX "blog_publication_id_idx" ON "blog" USING btree ("publicationId");--> statement-breakpoint
CREATE INDEX "blog_author_id_idx" ON "blog" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "blog_publication_published_created_idx" ON "blog" USING btree ("publicationId", "published", "createdAt");--> statement-breakpoint
CREATE INDEX "comment_publication_id_idx" ON "comment" USING btree ("publicationId");--> statement-breakpoint
CREATE INDEX "comment_blog_id_idx" ON "comment" USING btree ("blogId");--> statement-breakpoint
CREATE INDEX "comment_author_id_idx" ON "comment" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "comment_parent_id_idx" ON "comment" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "publication_user_id_idx" ON "publication" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_userId_unique" UNIQUE ("userId");
