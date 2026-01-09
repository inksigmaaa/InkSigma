-- Add 'admin' to member_role enum
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'admin';
