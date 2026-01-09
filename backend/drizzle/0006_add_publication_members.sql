-- Create member_role enum
DO $$ BEGIN
 CREATE TYPE "public"."member_role" AS ENUM('owner', 'editor', 'author');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create publication_member table
CREATE TABLE IF NOT EXISTS "publication_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicationId" integer NOT NULL,
	"userId" text NOT NULL,
	"role" "member_role" DEFAULT 'author' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add publicationId to blog table
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "publicationId" integer;

-- Add foreign keys
DO $$ BEGIN
 ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "blog" ADD CONSTRAINT "blog_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
