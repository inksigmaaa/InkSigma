-- Fix notification timestamps to use timezone-aware columns
-- This migration converts existing timestamp columns to timestamptz

ALTER TABLE "notification" 
ALTER COLUMN "createdAt" TYPE timestamp with time zone USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "notification" 
ALTER COLUMN "updatedAt" TYPE timestamp with time zone USING "updatedAt" AT TIME ZONE 'UTC';
