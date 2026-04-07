ALTER TABLE "publication" ADD COLUMN "customDomain" text;--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_customDomain_unique" UNIQUE("customDomain");