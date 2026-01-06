-- SQL script to fix the published field for existing blogs
-- Run this directly in your PostgreSQL database

-- Update blogs that have proper content to be published
UPDATE blog 
SET published = true 
WHERE title IS NOT NULL 
  AND description IS NOT NULL 
  AND content IS NOT NULL 
  AND length(trim(title)) > 0
  AND length(trim(description)) > 0
  AND length(trim(content)) > 0
  AND published = false;

-- Check the results
SELECT id, title, published, "createdAt" 
FROM blog 
ORDER BY "createdAt" DESC 
LIMIT 10;