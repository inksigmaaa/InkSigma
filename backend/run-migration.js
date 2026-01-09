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
}

runMigration();
