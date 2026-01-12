import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../models/schema.js';
import 'dotenv/config';

const { Pool } = pg;

export async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    try {
        console.log('🔄 Checking database schema...');
        // Just verify connection - drizzle-kit push handles schema sync
        await pool.query('SELECT 1');
        console.log('✅ Database connection verified!');
        console.log('💡 Schema is managed by drizzle-kit push');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}
