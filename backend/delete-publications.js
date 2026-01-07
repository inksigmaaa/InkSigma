// delete-publications.js
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function deletePublications() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔄 Connecting to database...');
        console.log('🗑️  Deleting all publications...');
        
        // Delete all publications
        const result = await pool.query('DELETE FROM publication RETURNING *');
        
        console.log(`✅ Deleted ${result.rowCount} publication(s)`);
        
        // Reset the sequence
        await pool.query('ALTER SEQUENCE IF EXISTS publication_id_seq RESTART WITH 1');
        
        // Verify
        const countResult = await pool.query('SELECT COUNT(*) as count FROM publication');
        console.log(`\n📊 Publication count: ${countResult.rows[0].count}`);
        
        console.log('\n✨ You can now test the publication creation flow!');
        
    } catch (error) {
        console.error('❌ Error deleting publications:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the deletion
deletePublications();
