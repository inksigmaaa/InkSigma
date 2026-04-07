CREATE TABLE IF NOT EXISTS "blog_slug_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"blogId" integer NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_slug_history_slug_unique" UNIQUE("slug"),
	CONSTRAINT "blog_slug_history_blog_id_slug_unique" UNIQUE("blogId","slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_slug_history" ADD CONSTRAINT "blog_slug_history_blogId_blog_id_fk" FOREIGN KEY ("blogId") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
