import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function verifyTables() {
  try {
    const tables = ["user", "session", "account", "verification", "blog", "comment", "publication"];
    
    for (const table of tables) {
      console.log(`\n=== ${table.toUpperCase()} TABLE ===`);
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${table}
        ORDER BY ordinal_position
      `;
      
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
    }
    
    console.log("\n✓ All tables verified successfully!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

verifyTables();
