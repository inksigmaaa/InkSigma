import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './config/database.js';
import logger from "./utils/logger.js";

async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('✅ Migrations completed successfully!');
  } catch (error) {
    logger.error(error, '❌ Migration failed:');
  } finally {
    await pool.end();
  }
}

runMigrations();