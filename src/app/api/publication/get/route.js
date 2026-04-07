import {
    authorizationErrorToResponse,
    requirePublicationOwner,
} from "@/server/auth/session";

export async function GET() {
    try {
        const { publication } = await requirePublicationOwner();

        return Response.json({ publication });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Error fetching publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
