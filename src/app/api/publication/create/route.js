import { db } from "@/db";
import { publication } from "@/db/schema";
import { sanitizePlainText } from "@/lib/sanitization";
import { parsePublicationCreatePayload } from "@/lib/validation/publication";
import {
    authorizationErrorToResponse,
    getPublicationForUser,
    requireSession,
} from "@/server/auth/session";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

export async function POST(request) {
    try {
        const session = await requireSession();

        const payload = parsePublicationCreatePayload(await request.json());
        const name = sanitizePlainText(payload.name);
        const subdomain = payload.subdomain;
        const image = payload.image;

        const existingOwnerPublication = await getPublicationForUser(session.user.id);

        if (existingOwnerPublication) {
            return Response.json(
                {
                    success: true,
                    publication: existingOwnerPublication,
                },
                { status: 200 }
            );
        }

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
                image,
                userId: session.user.id,
            })
            .returning();

        return Response.json({ 
            success: true, 
            publication: newPublication[0] 
        }, { status: 201 });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        if (error instanceof ZodError) {
            return Response.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
        }

        console.error("Error creating publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
