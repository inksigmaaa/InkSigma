<<<<<<< HEAD
// Run this script to apply the migration
// Usage: node run-migration.js

import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const migrationSQL = `
-- Add publicationId column to blog table if not exists
DO $$ BEGIN
    ALTER TABLE "blog" ADD COLUMN "publicationId" integer;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add foreign key for blog.publicationId
DO $$ BEGIN
    ALTER TABLE "blog" 
        ADD CONSTRAINT "blog_publicationId_publication_id_fk" 
        FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
DO $$ BEGIN
    ALTER TABLE "publication_member" 
        ADD CONSTRAINT "publication_member_publicationId_publication_id_fk" 
        FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "publication_member" 
        ADD CONSTRAINT "publication_member_userId_user_id_fk" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "publication_member" 
        ADD CONSTRAINT "publication_member_invitedBy_user_id_fk" 
        FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraints for invitation
DO $$ BEGIN
    ALTER TABLE "invitation" 
        ADD CONSTRAINT "invitation_publicationId_publication_id_fk" 
        FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invitation" 
        ADD CONSTRAINT "invitation_inviterId_user_id_fk" 
        FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
`;

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        
        console.log('Running migration...');
        await client.query(migrationSQL);
        
        console.log('✅ Migration completed successfully!');
        console.log('   - publication_member table created');
        console.log('   - invitation table created');
        console.log('   - member_role enum created');
        console.log('   - invitation_status enum created');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
=======
import "dotenv/config";
import { db } from "./config/database.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("Running migration to add 'admin' role...");
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "drizzle", "0007_add_admin_role.sql"),
      "utf-8"
    );
    
    await db.execute(sql.raw(migrationSQL));
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
>>>>>>> a558c50c83d353dff34342286a326d41a3515cc6
}

runMigration();
