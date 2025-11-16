import { auth } from "@/app/lib/auth";
import { db } from "@/db";
import { publication } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, subdomain, image } = body;

        if (!name || !subdomain) {
            return Response.json({ error: "Name and subdomain are required" }, { status: 400 });
        }

        // Check if subdomain already exists
        const existingPublication = await db
            .select()
            .from(publication)
            .where(eq(publication.subdomain, subdomain))
            .limit(1);

        if (existingPublication.length > 0) {
            return Response.json({ error: "This subdomain is already in use" }, { status: 409 });
        }

        // Create publication
        const newPublication = await db
            .insert(publication)
            .values({
                name,
                subdomain,
                image: image || null,
                userId: session.user.id,
            })
            .returning();

        return Response.json({ 
            success: true, 
            publication: newPublication[0] 
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
