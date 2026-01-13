import { pool } from "./config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log("Running timezone fix migration...\n");
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, "fix-notification-timezone.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");
        
        // Execute the migration
        await pool.query(sql);
        
        console.log("✅ Migration completed successfully!");
        console.log("Notification timestamps are now timezone-aware (timestamptz)\n");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        process.exit(1);
    }
}

runMigration();
