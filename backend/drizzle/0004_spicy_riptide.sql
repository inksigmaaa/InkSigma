ALTER TABLE "blog" DROP CONSTRAINT "blog_publicationId_publication_id_fk";
--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "publicationId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE set null ON UPDATE no action;