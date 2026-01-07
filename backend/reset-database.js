// reset-database.js
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function resetDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔄 Connecting to database...');
        
        // Read the SQL file
        const sqlFile = fs.readFileSync(path.join(__dirname, 'reset-database.sql'), 'utf8');
        
        console.log('🗑️  Truncating all tables...');
        
        // Execute the SQL
        const result = await pool.query(sqlFile);
        
        console.log('✅ Database reset successfully!');
        console.log('\n📊 Table counts after reset:');
        
        // Display the verification results
        if (result[result.length - 1]?.rows) {
            result[result.length - 1].rows.forEach(row => {
                console.log(`   ${row.table_name}: ${row.count} rows`);
            });
        }
        
        console.log('\n✨ You can now start fresh!');
        
    } catch (error) {
        console.error('❌ Error resetting database:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the reset
resetDatabase();
