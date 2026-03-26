DO $$ BEGIN
  CREATE TYPE "public"."custom_domain_status" AS ENUM('pending_verification', 'verified', 'ssl_pending', 'active', 'failed', 'detached');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "customDomainStatus" "custom_domain_status";
--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "customDomainVerificationToken" text;
--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "customDomainVerificationError" text;
--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "customDomainVerifiedAt" timestamp;
--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN IF NOT EXISTS "customDomainLastCheckedAt" timestamp;
