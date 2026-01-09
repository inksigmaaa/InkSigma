import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addReviewStatus() {
  try {
    console.log('Adding review status to blog_status enum...');
    
    // Add 'review' to the enum if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'review' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'blog_status')
        ) THEN
          ALTER TYPE blog_status ADD VALUE 'review';
        END IF;
      END $$;
    `);
    
    console.log('✓ Successfully added review status to blog_status enum');
    
  } catch (error) {
    console.error('Error adding review status:', error);
  } finally {
    await pool.end();
  }
}

addReviewStatus();
