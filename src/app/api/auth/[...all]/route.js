// Auth is now handled by the Express backend
// This route is kept for compatibility but redirects to backend

export async function GET(request) {
  const backendUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";
  const pathname = request.nextUrl.pathname.replace("/api/auth", "");
  const searchParams = request.nextUrl.search;
  
  try {
    const response = await fetch(`${backendUrl}/api/auth${pathname}${searchParams}`, {
      method: "GET",
      headers: request.headers,
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Auth proxy error:", error);
    return Response.json({ error: "Auth service unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  const backendUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";
  const pathname = request.nextUrl.pathname.replace("/api/auth", "");
  
  try {
    const body = await request.text();
    const response = await fetch(`${backendUrl}/api/auth${pathname}`, {
      method: "POST",
      headers: {
        ...Object.fromEntries(request.headers),
        "Content-Type": "application/json",
      },
      body: body,
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Auth proxy error:", error);
    return Response.json({ error: "Auth service unavailable" }, { status: 503 });
  }
}
