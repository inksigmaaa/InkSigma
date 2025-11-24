import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("better-auth.session_token")?.value;

        if (!sessionToken) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Call the backend to get publication
        const backendUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/api/publication`, {
            headers: {
                Cookie: `better-auth.session_token=${sessionToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return Response.json({ error: "No publication found" }, { status: 404 });
            }
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error("Error fetching publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
