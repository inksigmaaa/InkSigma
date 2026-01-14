CREATE TYPE "public"."notification_type" AS ENUM('invitation', 'invitation_declined', 'blog_accepted', 'blog_rejected', 'blog_review', 'blog_published', 'member_joined', 'member_removed');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"relatedUserId" text,
	"relatedBlogId" integer,
	"relatedPublicationId" integer,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "publicationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_relatedUserId_user_id_fk" FOREIGN KEY ("relatedUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_relatedBlogId_blog_id_fk" FOREIGN KEY ("relatedBlogId") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_relatedPublicationId_publication_id_fk" FOREIGN KEY ("relatedPublicationId") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;