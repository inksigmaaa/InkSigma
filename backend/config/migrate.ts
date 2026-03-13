import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

const { Pool } = pg;

export async function runMigrations() {
    logger.info("🔄 Checking database migrations...");
    
    // Check if migration files exist
    const migrationsFolder = "./drizzle";
    const sqlFiles = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
        logger.info("⚠️  No migration files found. Skipping migrations.");
        logger.info("   Database schema should already be set up.");
        return;
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool);
    
    try {
        await migrate(db, { migrationsFolder });
        logger.info("✅ Migrations completed successfully");
    } catch (error) {
        logger.error(error.message, "❌ Migration failed:");
        logger.info("⚠️  Continuing anyway - database may already be up to date");
    } finally {
        await pool.end();
    }
}
