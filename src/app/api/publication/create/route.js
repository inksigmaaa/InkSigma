import { cookies } from "next/headers";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("better-auth.session_token")?.value;

        if (!sessionToken) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, subdomain, image } = body;

        if (!name || !subdomain) {
            return Response.json({ error: "Name and subdomain are required" }, { status: 400 });
        }

        // Call the backend to create publication
        const backendUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/api/publication`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `better-auth.session_token=${sessionToken}`,
            },
            body: JSON.stringify({ name, subdomain, image }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return Response.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return Response.json(data, { status: 201 });
    } catch (error) {
        console.error("Error creating publication:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
