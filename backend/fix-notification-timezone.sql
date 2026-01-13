-- Fix notification table timestamps to use timezone-aware columns
-- This ensures timestamps are stored in UTC and properly converted

-- Update createdAt column to use timestamptz
ALTER TABLE notification 
ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- Update updatedAt column to use timestamptz  
ALTER TABLE notification 
ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification' 
AND column_name IN ('createdAt', 'updatedAt');
