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
            return Response.json({ hasPublication: false, authenticated: false }, { status: 401 });
        }

        const userPublications = await db
            .select()
            .from(publication)
            .where(eq(publication.userId, session.user.id))
            .limit(1);

        return Response.json({ 
            hasPublication: userPublications.length > 0,
            authenticated: true 
        });
    } catch (error) {
        console.error("Error checking publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
