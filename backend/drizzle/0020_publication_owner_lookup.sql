CREATE INDEX IF NOT EXISTS "idx_publication_user_created"
  ON "publication" ("userId", "createdAt");
