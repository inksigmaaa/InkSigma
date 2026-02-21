// config/database.js
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../models/schema.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
