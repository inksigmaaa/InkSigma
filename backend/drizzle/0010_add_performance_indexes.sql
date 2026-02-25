-- Add missing indexes for frequently queried columns
-- Performance optimization for N+1 and filtering queries

-- Index on blog.publicationId for filtering blogs by publication
CREATE INDEX IF NOT EXISTS "idx_blog_publicationId" ON "blog" ("publicationId");

-- Index on blog.status for filtering by status (published, draft, etc.)
CREATE INDEX IF NOT EXISTS "idx_blog_status" ON "blog" ("status");

-- Index on blog.authorId for author lookups
CREATE INDEX IF NOT EXISTS "idx_blog_authorId" ON "blog" ("authorId");

-- Index on blog.categories for category filtering (uses array)
CREATE INDEX IF NOT EXISTS "idx_blog_categories" ON "blog" USING GIN ("categories");

-- Index on blogView.blogId for analytics queries
CREATE INDEX IF NOT EXISTS "idx_blogView_blogId" ON "blog_view" ("blogId");

-- Index on blogView.viewerIdentifier for deduplication checks
CREATE INDEX IF NOT EXISTS "idx_blogView_viewerIdentifier" ON "blog_view" ("viewerIdentifier");

-- Index on comment.blogId for comment counts
CREATE INDEX IF NOT EXISTS "idx_comment_blogId" ON "comment" ("blogId");

-- Index on comment.authorId for user's comments
CREATE INDEX IF NOT EXISTS "idx_comment_authorId" ON "comment" ("authorId");

-- Index on publication.subdomain for fast lookups
CREATE INDEX IF NOT EXISTS "idx_publication_subdomain" ON "publication" ("subdomain");

-- Index on publication.customDomain for custom domain lookups
CREATE INDEX IF NOT EXISTS "idx_publication_customDomain" ON "publication" ("customDomain");

-- Composite index for blog listing (common query pattern)
CREATE INDEX IF NOT EXISTS "idx_blog_publication_status_created" ON "blog" ("publicationId", "status", "createdAt");

-- Composite index for author's blogs
CREATE INDEX IF NOT EXISTS "idx_blog_author_status_created" ON "blog" ("authorId", "status", "createdAt");
