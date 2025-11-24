DROP TABLE "publicationTeamMember" CASCADE;--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN "logoUrl" text;--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN "faviconUrl" text;--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN "metaOgImageUrl" text;--> statement-breakpoint
ALTER TABLE "publication" DROP COLUMN "customDomain";--> statement-breakpoint
ALTER TABLE "publication" DROP COLUMN "status";