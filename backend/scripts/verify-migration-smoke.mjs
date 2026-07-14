import "dotenv/config";

import pg from "pg";

const { Client } = pg;

const requiredTables = [
  "publication",
  "publication_member",
  "notification",
  "publication_hostname",
  "blog_slug_history",
  "subscriber",
  "transaction",
];

const requiredIndexes = [
  "idx_publication_member_publication_user",
  "idx_publication_member_user_publication",
  "idx_publication_member_publication_role",
  "idx_notification_user_created_desc",
  "idx_notification_user_is_read",
];

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (process.env.CI === "true") {
    throw new Error("DATABASE_URL is required for migration smoke verification");
  }

  process.stdout.write(
    "Migration smoke skipped: set DATABASE_URL in backend/.env or the shell to run it locally.\n",
  );
  process.exit(0);
}

const client = new Client({ connectionString: databaseUrl });

const assertTables = async () => {
  const { rows } = await client.query(
    `
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `,
  );

  const tableSet = new Set(rows.map((row) => row.tablename));
  const missing = requiredTables.filter((tableName) => !tableSet.has(tableName));

  if (missing.length) {
    throw new Error(`Missing required tables: ${missing.join(", ")}`);
  }
};

const assertIndexes = async () => {
  const { rows } = await client.query(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `,
  );

  const indexSet = new Set(rows.map((row) => row.indexname));
  const missing = requiredIndexes.filter((indexName) => !indexSet.has(indexName));

  if (missing.length) {
    throw new Error(`Missing required indexes: ${missing.join(", ")}`);
  }
};

const run = async () => {
  await client.connect();
  await assertTables();
  await assertIndexes();
  await client.end();
  process.stdout.write("Migration smoke verification passed.\n");
};

run().catch(async (error) => {
  try {
    await client.end();
  } catch {
    // Ignore disconnect errors.
  }

  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
