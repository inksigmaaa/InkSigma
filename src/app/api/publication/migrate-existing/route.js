import { db } from "@/db";
import { user, publication } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST() {
    try {
        // Get all users
        const allUsers = await db.select().from(user);

        let created = 0;
        let skipped = 0;

        for (const u of allUsers) {
            // Check if user already has a publication
            const existingPub = await db
                .select()
                .from(publication)
                .where(eq(publication.userId, u.id))
                .limit(1);

            if (existingPub.length > 0) {
                skipped++;
                continue;
            }

            // Create default publication
            const defaultSubdomain = u.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
            const defaultName = u.name || "My Publication";

            await db.insert(publication).values({
                name: defaultName,
                subdomain: `${defaultSubdomain}-${u.id.slice(0, 6)}`,
                description: null,
                image: u.image || null,
                userId: u.id,
            });

            created++;
        }

        return Response.json({
            success: true,
            message: `Migration completed. Created: ${created}, Skipped: ${skipped}`,
            created,
            skipped,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return Response.json(
            { error: "Migration failed", details: error.message },
            { status: 500 }
        );
    }
}
