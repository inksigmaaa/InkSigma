import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { getDatabaseUrl } from "./src/config/server-env.js";

dotenv.config({ path: ".env.local" });

export default defineConfig({
    schema: "./src/db/schema.js",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: getDatabaseUrl(),
    },
});
