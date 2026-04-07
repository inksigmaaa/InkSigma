CREATE INDEX IF NOT EXISTS "idx_blog_publication_status_created" ON "blog" USING btree ("publicationId","status","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_author_status_created" ON "blog" USING btree ("authorId","status","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_publication_status_published_at" ON "blog" USING btree ("publicationId","status","publishedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_master_id" ON "blog" USING btree ("masterId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_status_scheduled_at" ON "blog" USING btree ("status","scheduledAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_share_blog_created" ON "blog_share" USING btree ("blogId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "blog_view_blog_viewer_unique" ON "blog_view" USING btree ("blogId","viewerIdentifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_view_blog_created" ON "blog_view" USING btree ("blogId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comment_blog_parent_created" ON "comment" USING btree ("blogId","parentId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_user_read_created" ON "notification" USING btree ("userId","isRead","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "publication_member_publication_user_unique" ON "publication_member" USING btree ("publicationId","userId");
