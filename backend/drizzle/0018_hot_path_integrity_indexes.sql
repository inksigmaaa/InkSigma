CREATE INDEX IF NOT EXISTS "idx_blog_publication_status_published_at"
  ON "blog" ("publicationId", "status", "publishedAt");

CREATE INDEX IF NOT EXISTS "idx_blog_master_id"
  ON "blog" ("masterId");

CREATE INDEX IF NOT EXISTS "idx_blog_status_scheduled_at"
  ON "blog" ("status", "scheduledAt");

CREATE INDEX IF NOT EXISTS "idx_comment_blog_parent_created"
  ON "comment" ("blogId", "parentId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "publication_member_publication_user_unique"
  ON "publication_member" ("publicationId", "userId");

CREATE INDEX IF NOT EXISTS "idx_notification_user_read_created"
  ON "notification" ("userId", "isRead", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "blog_view_blog_viewer_unique"
  ON "blog_view" ("blogId", "viewerIdentifier");

CREATE INDEX IF NOT EXISTS "idx_blog_view_blog_created"
  ON "blog_view" ("blogId", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_blog_share_blog_created"
  ON "blog_share" ("blogId", "createdAt");
