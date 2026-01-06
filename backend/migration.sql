-- Migration: Add blog status enum and sync with published column
-- Run this manually in your PostgreSQL database

-- Step 1: Create the enum type
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'unpublished');

-- Step 2: Add the status column with default value
ALTER TABLE blog ADD COLUMN status blog_status NOT NULL DEFAULT 'draft';

-- Step 3: Update existing records based on published field
UPDATE blog SET status = CASE 
    WHEN published = true THEN 'published'::blog_status 
    ELSE 'draft'::blog_status 
END;

-- Step 4: Add database constraint to enforce sync rules
-- This constraint ensures the published boolean column always matches the status
ALTER TABLE blog ADD CONSTRAINT check_status_published_sync 
CHECK (
    (status = 'published' AND published = true) OR 
    (status IN ('draft', 'unpublished') AND published = false)
);

-- Step 5: Create a trigger function to automatically sync the fields
CREATE OR REPLACE FUNCTION sync_blog_status_published()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set published based on status
    IF NEW.status = 'published' THEN
        NEW.published = true;
    ELSE
        NEW.published = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers for INSERT and UPDATE
CREATE TRIGGER trigger_sync_blog_status_published_insert
    BEFORE INSERT ON blog
    FOR EACH ROW
    EXECUTE FUNCTION sync_blog_status_published();

CREATE TRIGGER trigger_sync_blog_status_published_update
    BEFORE UPDATE ON blog
    FOR EACH ROW
    EXECUTE FUNCTION sync_blog_status_published();

-- Step 7: Verify the migration and sync rules
SELECT id, title, status, published, 
       CASE 
           WHEN status = 'published' AND published = true THEN '✓ Correct'
           WHEN status IN ('draft', 'unpublished') AND published = false THEN '✓ Correct'
           ELSE '❌ Needs Fix'
       END as sync_status
FROM blog 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Step 8: Test the constraint (this should fail)
-- INSERT INTO blog (slug, title, description, content, "authorId", status, published) 
-- VALUES ('test-constraint', 'Test', 'Test', 'Test', 'test-user', 'published', false);

COMMENT ON CONSTRAINT check_status_published_sync ON blog IS 
'Ensures status and published columns remain synchronized according to publishing logic rules';

COMMENT ON FUNCTION sync_blog_status_published() IS 
'Automatically synchronizes published boolean with status enum to enforce publishing logic rules';