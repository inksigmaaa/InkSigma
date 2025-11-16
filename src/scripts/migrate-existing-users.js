import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user, publication } from "../db/schema.js";
import { eq, notExists } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString);
const db = drizzle(client);

async function migrateExistingUsers() {
    try {
        console.log("Starting migration for existing users...");

        // Get all users who don't have a publication
        const usersWithoutPublication = await db
            .select()
            .from(user)
            .where(
                notExists(
                    db.select().from(publication).where(eq(publication.userId, user.id))
                )
            );

        console.log(`Found ${usersWithoutPublication.length} users without publications`);

        // Create default publications for each user
        for (const u of usersWithoutPublication) {
            const defaultSubdomain = u.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
            const defaultName = u.name || "My Publication";

            try {
                await db.insert(publication).values({
                    name: defaultName,
                    subdomain: `${defaultSubdomain}-${u.id.slice(0, 6)}`,
                    description: null,
                    image: u.image || null,
                    userId: u.id,
                });

                console.log(`✓ Created publication for user: ${u.email}`);
            } catch (error) {
                console.error(`✗ Failed to create publication for user ${u.email}:`, error.message);
            }
        }

        console.log("Migration completed!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

migrateExistingUsers();
