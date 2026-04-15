import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

// Fully lazy — nothing is created at module load time so the build
// succeeds even when DATABASE_URL is not set.
let pool: pg.Pool | null = null;
let _db: NodePgDatabase | null = null;

function getDb(): NodePgDatabase {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
    });
    _db = drizzle(pool);
  }
  return _db;
}

// Proxy that defers all property access to the lazily-created drizzle instance.
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
