DO $$ BEGIN
  CREATE TYPE "public"."publication_hostname_kind" AS ENUM('subdomain', 'custom_domain');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."publication_hostname_status" AS ENUM('active', 'redirect');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publication_hostname" (
  "id" serial PRIMARY KEY NOT NULL,
  "publicationId" integer NOT NULL,
  "kind" "publication_hostname_kind" NOT NULL,
  "value" text NOT NULL,
  "status" "publication_hostname_status" DEFAULT 'active' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "publication_hostname_kind_value_unique" UNIQUE("kind","value")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "publication_hostname"
    ADD CONSTRAINT "publication_hostname_publicationId_publication_id_fk"
    FOREIGN KEY ("publicationId")
    REFERENCES "public"."publication"("id")
    ON DELETE cascade
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
