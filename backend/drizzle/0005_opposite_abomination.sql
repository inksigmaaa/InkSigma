CREATE TYPE "public"."member_role" AS ENUM('owner', 'editor', 'author');--> statement-breakpoint
CREATE TABLE "publication_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicationId" integer NOT NULL,
	"userId" text NOT NULL,
	"role" "member_role" DEFAULT 'author' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "publicationId" integer;--> statement-breakpoint
ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;