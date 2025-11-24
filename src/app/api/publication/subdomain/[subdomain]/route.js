import { db } from "@/db";
import { publication } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
    try {
        const { subdomain } = params;

        if (!subdomain) {
            return Response.json({ error: "Subdomain is required" }, { status: 400 });
        }

        const publications = await db
            .select()
            .from(publication)
            .where(eq(publication.subdomain, subdomain))
            .limit(1);

        if (publications.length === 0) {
            return Response.json({ error: "Publication not found" }, { status: 404 });
        }

        return Response.json({ publication: publications[0] });
    } catch (error) {
        console.error("Error fetching publication by subdomain:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
