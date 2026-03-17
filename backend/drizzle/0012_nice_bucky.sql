CREATE TYPE "public"."publication_hostname_kind" AS ENUM('subdomain', 'custom_domain');--> statement-breakpoint
CREATE TYPE "public"."publication_hostname_status" AS ENUM('active', 'redirect');--> statement-breakpoint
CREATE TABLE "publication_hostname" (
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
ALTER TABLE "publication_hostname" ADD CONSTRAINT "publication_hostname_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;