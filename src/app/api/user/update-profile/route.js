import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token")?.value;

    if (!sessionToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, bio } = body;

    console.log('Updating profile with:', { name, username, bio });

    // Call the backend to update user profile
    const backendUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";
    const response = await fetch(`${backendUrl}/api/user/update-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${sessionToken}`,
      },
      body: JSON.stringify({ name, username, bio }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
