-- Migration: Remove views and likes columns from blog table
-- Since we track views in the separate blog_view table, these columns are redundant

-- Remove the views column from blog table
ALTER TABLE blog DROP COLUMN IF EXISTS views;

-- Remove the likes column from blog table (if you want to add likes later, create a separate blog_like table)
ALTER TABLE blog DROP COLUMN IF EXISTS likes;

-- Note: View counts are now calculated by counting records in the blog_view table
-- This provides more accurate tracking with 24-hour deduplication
