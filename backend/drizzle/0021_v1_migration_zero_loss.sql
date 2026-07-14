-- ============================================================
-- 0021: v1 -> v2 migration — zero-loss schema extensions
-- Adds `subscriber` + `transaction` tables and legacy/provenance
-- columns so every v1 field has a destination on import.
-- Purely additive + idempotent (safe to run anytime pre-cutover).
-- ============================================================

-- Enums ------------------------------------------------------
DO $$ BEGIN
 CREATE TYPE "public"."subscriber_type" AS ENUM('free', 'paid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."transaction_status" AS ENUM('failed', 'cancelled', 'completed', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- New tables -------------------------------------------------
CREATE TABLE IF NOT EXISTS "subscriber" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicationId" integer NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"type" "subscriber_type" DEFAULT 'free' NOT NULL,
	"unsubscribedAt" timestamp,
	"source" text DEFAULT 'v1',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text,
	"externalId" text,
	"amount" integer NOT NULL,
	"currency" text,
	"purpose" text,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"remarks" text,
	"planCycle" jsonb,
	"extraInfo" jsonb,
	"source" text DEFAULT 'v1',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint

-- Foreign keys ----------------------------------------------
DO $$ BEGIN
 ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Indexes ----------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "subscriber_publication_email_unique" ON "subscriber" USING btree ("publicationId","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriber_publication_created" ON "subscriber" USING btree ("publicationId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transaction_user_created" ON "transaction" USING btree ("userId","createdAt");--> statement-breakpoint

-- Legacy / provenance columns on existing tables -------------
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "legacyMetadata" jsonb;--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "legacyMetadata" jsonb;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "legacyViewCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "seoMetadata" jsonb;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "migrationMeta" jsonb;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
