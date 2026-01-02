// config/database.js
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../models/schema.js";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export { pool };
