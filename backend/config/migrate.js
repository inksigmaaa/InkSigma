import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

export async function runMigrations() {
    console.log("🔄 Checking database migrations...");
    
    // Check if migration files exist
    const migrationsFolder = "./drizzle";
    const sqlFiles = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
        console.log("⚠️  No migration files found. Skipping migrations.");
        console.log("   Database schema should already be set up.");
        return;
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool);
    
    try {
        await migrate(db, { migrationsFolder });
        console.log("✅ Migrations completed successfully");
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        console.log("⚠️  Continuing anyway - database may already be up to date");
    } finally {
        await pool.end();
    }
}
