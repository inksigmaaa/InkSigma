-- Reset Database Script
-- This will delete all data from all tables and reset sequences

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables
TRUNCATE TABLE comment CASCADE;
TRUNCATE TABLE blog CASCADE;
TRUNCATE TABLE publication CASCADE;
TRUNCATE TABLE verification CASCADE;
TRUNCATE TABLE session CASCADE;
TRUNCATE TABLE account CASCADE;
TRUNCATE TABLE "user" CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS comment_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS blog_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS publication_id_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify tables are empty
SELECT 'user' as table_name, COUNT(*) as count FROM "user"
UNION ALL
SELECT 'account', COUNT(*) FROM account
UNION ALL
SELECT 'session', COUNT(*) FROM session
UNION ALL
SELECT 'verification', COUNT(*) FROM verification
UNION ALL
SELECT 'blog', COUNT(*) FROM blog
UNION ALL
SELECT 'comment', COUNT(*) FROM comment
UNION ALL
SELECT 'publication', COUNT(*) FROM publication;
