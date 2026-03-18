CREATE TYPE "public"."custom_domain_status" AS ENUM(
  'pending_verification',
  'verified',
  'ssl_pending',
  'active',
  'failed',
  'detached'
);--> statement-breakpoint
ALTER TABLE "publication"
ADD COLUMN "customDomainStatus" "custom_domain_status";--> statement-breakpoint
ALTER TABLE "publication"
ADD COLUMN "customDomainVerificationToken" text;--> statement-breakpoint
ALTER TABLE "publication"
ADD COLUMN "customDomainVerificationError" text;--> statement-breakpoint
ALTER TABLE "publication"
ADD COLUMN "customDomainVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "publication"
ADD COLUMN "customDomainLastCheckedAt" timestamp;--> statement-breakpoint
UPDATE "publication"
SET
  "customDomainStatus" = 'active',
  "customDomainVerifiedAt" = COALESCE("updatedAt", NOW()),
  "customDomainLastCheckedAt" = COALESCE("updatedAt", NOW())
WHERE "customDomain" IS NOT NULL;--> statement-breakpoint
