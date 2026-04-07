import { db } from "@/db";
import { user, publication } from "@/db/schema";
import {
    authorizationErrorToResponse,
    requireAdminSession,
} from "@/server/auth/session";
import { eq, notExists } from "drizzle-orm";

export async function POST() {
    try {
        await requireAdminSession();

        const usersWithoutPublication = await db
            .select()
            .from(user)
            .where(
                notExists(
                    db.select().from(publication).where(eq(publication.userId, user.id))
                )
            );

        let created = 0;

        for (const u of usersWithoutPublication) {
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
            message: `Migration completed. Created: ${created}, Skipped: 0`,
            created,
            skipped: 0,
        });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Migration error:", error);
        return Response.json(
            { error: "Migration failed", details: error.message },
            { status: 500 }
        );
    }
}
