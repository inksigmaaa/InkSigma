import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "@/config/server-env";
import * as schema from "./schema";

const globalForDb = globalThis;
function createDb() {
  const connectionString = getDatabaseUrl();
  const client =
    globalForDb.__inkSigmaPostgresClient ?? postgres(connectionString);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__inkSigmaPostgresClient = client;
  }

  return drizzle(client, { schema });
}

export function getDb() {
  if (!globalForDb.__inkSigmaDrizzleDb) {
    globalForDb.__inkSigmaDrizzleDb = createDb();
  }

  return globalForDb.__inkSigmaDrizzleDb;
}

export const db = new Proxy(
  {},
  {
    get(_target, property, receiver) {
      const instance = getDb();
      const value = Reflect.get(instance, property, receiver);

      return typeof value === "function" ? value.bind(instance) : value;
    },
  }
);
