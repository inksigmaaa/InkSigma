CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('admin', 'editor', 'author');--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicationId" integer NOT NULL,
	"inviterId" text NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "publication_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicationId" integer NOT NULL,
	"userId" text NOT NULL,
	"role" "member_role" NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"invitedBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_user_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_publicationId_publication_id_fk" FOREIGN KEY ("publicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_member" ADD CONSTRAINT "publication_member_invitedBy_user_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;