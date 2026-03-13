import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "@/config/server-env";
import * as schema from "./schema";

const connectionString = getDatabaseUrl();
const globalForDb = globalThis;

const client =
  globalForDb.__inkSigmaPostgresClient ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__inkSigmaPostgresClient = client;
}

export const db = drizzle(client, { schema });
