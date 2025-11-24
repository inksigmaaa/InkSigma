const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const schema = require("../db/schema.cjs");

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
    console.warn('⚠️ DATABASE_URL not found. Database operations will fail.');
}

// Create PostgreSQL client
const client = connectionString ? postgres(connectionString) : null;

// Create Drizzle instance
const db = client ? drizzle(client, { schema }) : null;

module.exports = { db, client };
