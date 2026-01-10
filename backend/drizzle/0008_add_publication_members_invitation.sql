-- Migration: Add publication_member and invitation tables

-- Create member_role enum if not exists
DO $$ BEGIN
    CREATE TYPE "member_role" AS ENUM('admin', 'editor', 'author');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create invitation_status enum if not exists
DO $$ BEGIN
    CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create publication_member table
CREATE TABLE IF NOT EXISTS "publication_member" (
    "id" serial PRIMARY KEY NOT NULL,
    "publicationId" integer NOT NULL,
    "userId" text NOT NULL,
    "role" "member_role" NOT NULL DEFAULT 'author',
    "invitedBy" text,
    "joinedAt" timestamp NOT NULL DEFAULT now(),
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create invitation table
CREATE TABLE IF NOT EXISTS "invitation" (
    "id" serial PRIMARY KEY NOT NULL,
    "publicationId" integer NOT NULL,
    "inviterId" text NOT NULL,
    "email" text NOT NULL,
    "role" "member_role" NOT NULL DEFAULT 'author',
    "token" text NOT NULL UNIQUE,
    "status" "invitation_status" NOT NULL DEFAULT 'pending',
    "expiresAt" timestamp NOT NULL,
    "acceptedAt" timestamp,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Add foreign key constraints for publication_member
ALTER TABLE "publication_member" 
    ADD CONSTRAINT "publication_member_publicationId_publication_id_fk" 
    FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "publication_member" 
    ADD CONSTRAINT "publication_member_userId_user_id_fk" 
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "publication_member" 
    ADD CONSTRAINT "publication_member_invitedBy_user_id_fk" 
    FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add foreign key constraints for invitation
ALTER TABLE "invitation" 
    ADD CONSTRAINT "invitation_publicationId_publication_id_fk" 
    FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "invitation" 
    ADD CONSTRAINT "invitation_inviterId_user_id_fk" 
    FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
