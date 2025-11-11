CREATE TABLE "blog" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"authorId" text NOT NULL,
	"categories" text[],
	"published" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"blogId" text NOT NULL,
	"authorId" text NOT NULL,
	"parentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_blogId_blog_id_fk" FOREIGN KEY ("blogId") REFERENCES "public"."blog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;