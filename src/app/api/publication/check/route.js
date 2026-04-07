import { getPublicationForUser, getSessionOrNull } from "@/server/auth/session";

export async function GET() {
    try {
        const session = await getSessionOrNull();

        if (!session) {
            return Response.json({ hasPublication: false, authenticated: false }, { status: 401 });
        }

        const userPublication = await getPublicationForUser(session.user.id);
        const hasPublication = userPublication !== null;

        return Response.json({ 
            hasPublication,
            authenticated: true 
        });
    } catch (error) {
        console.error("Error checking publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
