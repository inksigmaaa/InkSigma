CREATE TABLE "publicationTeamMember" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicationId" integer NOT NULL,
	"userId" text NOT NULL,
	"role" text DEFAULT 'author' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN "customDomain" text;--> statement-breakpoint
ALTER TABLE "publication" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "publicationTeamMember" ADD CONSTRAINT "publicationTeamMember_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicationTeamMember" ADD CONSTRAINT "publicationTeamMember_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;