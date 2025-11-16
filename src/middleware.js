import { NextResponse } from "next/server";

const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/magic-link",
];

// Routes that should be accessible without authentication
const publicPaths = [
    "/view-site",
];

// Routes that don't require publication check
const skipPublicationCheck = [
    "/create-publication",
    "/profile-settings",
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
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Get session token
    const sessionToken = request.cookies.get("better-auth.session_token");

    // If accessing protected route without session, redirect to login
    if (!isPublicRoute && !isPublicPath && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If accessing auth pages while logged in, redirect to home
    if (isPublicRoute && pathname !== "/" && sessionToken) {
        return NextResponse.redirect(new URL("/home", request.url));
    }

    // Check if user has a publication (for authenticated users on protected routes)
    if (sessionToken && !isPublicRoute && !isPublicPath) {
        const shouldCheckPublication = !skipPublicationCheck.some(path => pathname.startsWith(path));
        
        if (shouldCheckPublication) {
            try {
                const checkUrl = new URL("/api/publication/check", request.url);
                const response = await fetch(checkUrl, {
                    headers: {
                        Cookie: `better-auth.session_token=${sessionToken.value}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // If user doesn't have a publication, redirect to create-publication
                    if (!data.hasPublication) {
                        return NextResponse.redirect(new URL("/create-publication", request.url));
                    }
                }
            } catch (error) {
                console.error("Error checking publication:", error);
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
