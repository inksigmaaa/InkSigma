import { NextResponse } from "next/server";

const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/magic-link",
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes, static files, and public assets
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/icons") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Check if route is public
    const isPublicRoute = publicRoutes.includes(pathname);

    // Get session token
    const sessionToken = request.cookies.get("better-auth.session_token");

    // If accessing protected route without session, redirect to login
    if (!isPublicRoute && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If accessing auth pages while logged in, redirect to dashboard
    if (isPublicRoute && pathname !== "/" && sessionToken) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
