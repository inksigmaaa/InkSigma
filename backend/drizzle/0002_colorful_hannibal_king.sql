CREATE TABLE "user_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"profileName" text,
	"username" text,
	"bio" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_userId_unique" UNIQUE("userId"),
	CONSTRAINT "user_profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;