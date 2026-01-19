// Migration script to remove views and likes columns from blog table
// Run with: node migrate-remove-views-column.js

import { db } from './config/database.js';
import { sql } from 'drizzle-orm';

async function migrateRemoveViewsColumn() {
    console.log('='.repeat(60));
    console.log('MIGRATION: Remove views and likes columns from blog table');
    console.log('='.repeat(60));
    
    try {
        console.log('\n📊 Checking current blog table structure...');
        
        // Check if columns exist
        const columnsCheck = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'blog' 
            AND column_name IN ('views', 'likes')
        `);
        
        if (columnsCheck.rows.length === 0) {
            console.log('✅ Columns already removed. Nothing to do.');
            return;
        }
        
        console.log(`\n⚠️  Found ${columnsCheck.rows.length} column(s) to remove:`);
        columnsCheck.rows.forEach(row => {
            console.log(`   - ${row.column_name}`);
        });
        
        console.log('\n🗑️  Removing views column...');
        await db.execute(sql`ALTER TABLE blog DROP COLUMN IF EXISTS views`);
        console.log('✅ views column removed');
        
        console.log('\n🗑️  Removing likes column...');
        await db.execute(sql`ALTER TABLE blog DROP COLUMN IF EXISTS likes`);
        console.log('✅ likes column removed');
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
        console.log('='.repeat(60));
        console.log('\n📝 Note: View counts are now calculated from blog_view table');
        console.log('   Use: SELECT COUNT(*) FROM blog_view WHERE "blogId" = ?');
        console.log('\n');
        
    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error);
        console.error('\nYou may need to run the SQL manually:');
        console.error('  ALTER TABLE blog DROP COLUMN IF EXISTS views;');
        console.error('  ALTER TABLE blog DROP COLUMN IF EXISTS likes;');
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrateRemoveViewsColumn();
