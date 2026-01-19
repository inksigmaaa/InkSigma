CREATE TABLE "blog_share" (
	"id" serial PRIMARY KEY NOT NULL,
	"blogId" integer NOT NULL,
	"platform" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"blogId" integer NOT NULL,
	"viewerIdentifier" text NOT NULL,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "authorId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "guestName" text;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "guestEmail" text;--> statement-breakpoint
ALTER TABLE "blog_share" ADD CONSTRAINT "blog_share_blogId_blog_id_fk" FOREIGN KEY ("blogId") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_view" ADD CONSTRAINT "blog_view_blogId_blog_id_fk" FOREIGN KEY ("blogId") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" DROP COLUMN "views";--> statement-breakpoint
ALTER TABLE "blog" DROP COLUMN "likes";