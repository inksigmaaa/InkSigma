import { auth } from "@/app/lib/auth";
import { db } from "@/db";
import { publication } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userPublications = await db
            .select()
            .from(publication)
            .where(eq(publication.userId, session.user.id))
            .limit(1);

        if (userPublications.length === 0) {
            return Response.json({ error: "No publication found" }, { status: 404 });
        }

        return Response.json({ publication: userPublications[0] });
    } catch (error) {
        console.error("Error fetching publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
