// config/database.js
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../models/schema.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Pool sizing
  max: parseInt(process.env.PG_POOL_MAX ?? "20", 10),
  min: parseInt(process.env.PG_POOL_MIN ?? "2", 10),

  // Timeouts — fail fast instead of hanging
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,

  // Rotate connections to prevent pg backend memory leaks
  maxUses: 7500,

  // Ensure timestamps are returned in UTC
  types: {
    getTypeParser: (typeId, format) => {
      if (typeId === 1114 || typeId === 1184) {
        return (val) => val;
      }
      return pg.types.getTypeParser(typeId, format);
    },
  },
});

export const db = drizzle(pool, { schema });
export { pool };
