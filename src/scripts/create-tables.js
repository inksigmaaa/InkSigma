import postgres from "postgres";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log("Checking existing tables...");
    
    // Check existing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log("Existing tables:", tables.map(t => t.table_name));
    
    // Read and execute migration files in order
    const migrations = [
      "drizzle/0000_ancient_shockwave.sql",
      "drizzle/0001_rich_squadron_sinister.sql",
      "drizzle/0002_confused_lake.sql"
    ];
    
    for (const migrationFile of migrations) {
      console.log(`\nApplying migration: ${migrationFile}`);
      try {
        const migrationSQL = readFileSync(migrationFile, "utf-8");
        
        // Split by statement breakpoint and execute each statement
        const statements = migrationSQL
          .split("--> statement-breakpoint")
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        for (const statement of statements) {
          try {
            await sql.unsafe(statement);
            console.log("✓ Statement executed successfully");
          } catch (error) {
            // Ignore "already exists" errors
            if (error.message.includes("already exists") || 
                error.code === "42P07" || 
                error.code === "42710") {
              console.log("⊘ Already exists, skipping...");
            } else {
              console.log("✗ Error:", error.message);
            }
          }
        }
      } catch (error) {
        console.log("Error reading migration file:", error.message);
      }
    }
    
    // Final check
    console.log("\n=== Final table list ===");
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log("Tables created:");
    finalTables.forEach(t => console.log(`  - ${t.table_name}`));
    
    console.log("\n✓ Database setup complete!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

createTables();
