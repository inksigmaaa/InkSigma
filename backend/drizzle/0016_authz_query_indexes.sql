-- Authorization and notification query performance indexes

CREATE INDEX IF NOT EXISTS "idx_publication_member_publication_user"
  ON "publication_member" ("publicationId", "userId");

CREATE INDEX IF NOT EXISTS "idx_publication_member_user_publication"
  ON "publication_member" ("userId", "publicationId");

CREATE INDEX IF NOT EXISTS "idx_publication_member_publication_role"
  ON "publication_member" ("publicationId", "role");

CREATE INDEX IF NOT EXISTS "idx_notification_user_created_desc"
  ON "notification" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_notification_user_is_read"
  ON "notification" ("userId", "isRead");
