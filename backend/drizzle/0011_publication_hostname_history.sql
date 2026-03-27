CREATE TYPE "publication_hostname_kind" AS ENUM('subdomain', 'custom_domain');--> statement-breakpoint
CREATE TYPE "publication_hostname_status" AS ENUM('active', 'redirect');--> statement-breakpoint

CREATE TABLE "publication_hostname" (
  "id" serial PRIMARY KEY NOT NULL,
  "publicationId" integer NOT NULL,
  "kind" "publication_hostname_kind" NOT NULL,
  "value" text NOT NULL,
  "status" "publication_hostname_status" DEFAULT 'active' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "publication_hostname_publicationId_publication_id_fk"
    FOREIGN KEY ("publicationId")
    REFERENCES "public"."publication"("id")
    ON DELETE cascade
    ON UPDATE no action,
  CONSTRAINT "publication_hostname_kind_value_unique" UNIQUE("kind", "value")
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_publication_hostname_publicationId"
  ON "publication_hostname" ("publicationId");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_publication_hostname_kind_value"
  ON "publication_hostname" ("kind", "value");--> statement-breakpoint

INSERT INTO "publication_hostname" (
  "publicationId",
  "kind",
  "value",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'subdomain',
  lower("subdomain"),
  CASE
    WHEN "customDomain" IS NULL OR trim("customDomain") = '' THEN 'active'::"publication_hostname_status"
    ELSE 'redirect'::"publication_hostname_status"
  END,
  now(),
  now()
FROM "publication"
ON CONFLICT ("kind", "value") DO NOTHING;--> statement-breakpoint

INSERT INTO "publication_hostname" (
  "publicationId",
  "kind",
  "value",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'custom_domain',
  lower(trim("customDomain")),
  'active'::"publication_hostname_status",
  now(),
  now()
FROM "publication"
WHERE "customDomain" IS NOT NULL AND trim("customDomain") <> ''
ON CONFLICT ("kind", "value") DO NOTHING;
