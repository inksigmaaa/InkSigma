import 'dotenv/config';
import { pool } from './config/database.js';

async function addGuestColumns() {
  try {
    console.log('Adding guestName and guestEmail columns to comment table...');
    
    await pool.query(`
      ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "guestName" text;
    `);
    console.log('✓ Added guestName column');
    
    await pool.query(`
      ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "guestEmail" text;
    `);
    console.log('✓ Added guestEmail column');
    
    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

addGuestColumns();
