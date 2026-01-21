-- Add guest comment fields to support anonymous comments
ALTER TABLE "comment" ADD COLUMN "guestName" text;
ALTER TABLE "comment" ADD COLUMN "guestEmail" text;
