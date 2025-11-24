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
    const hostname = request.headers.get("host") || "";
    
    // Check if this is a subdomain request
    // Support: subdomain.inksigma.com, subdomain.inksigma.local, subdomain.lvh.me
    const isSubdomain = (
        (hostname.includes(".inksigma.com") || 
         hostname.includes(".inksigma.local") || 
         hostname.includes(".lvh.me")) 
        && !hostname.startsWith("www.")
        && !hostname.startsWith("localhost")
    );
    
    // If it's a subdomain request, handle it immediately (skip auth checks)
    if (isSubdomain) {
        const subdomain = hostname.split(".")[0];
        
        // For root path, rewrite to view-site but keep subdomain URL
        if (pathname === "/") {
            const url = request.nextUrl.clone();
            url.pathname = "/view-site";
            url.searchParams.set("subdomain", subdomain);
            return NextResponse.rewrite(url);
        }
        
        // For blog paths, rewrite to view-site/blog but keep subdomain URL
        if (pathname.startsWith("/blog/")) {
            const url = request.nextUrl.clone();
            url.pathname = `/view-site${pathname}`;
            url.searchParams.set("subdomain", subdomain);
            return NextResponse.rewrite(url);
        }
        
        // For API routes on subdomain, allow them through
        if (pathname.startsWith("/api")) {
            return NextResponse.next();
        }
        
        // For other paths on subdomain, rewrite to view-site
        if (!pathname.startsWith("/_next")) {
            const url = request.nextUrl.clone();
            url.pathname = `/view-site${pathname}`;
            url.searchParams.set("subdomain", subdomain);
            return NextResponse.rewrite(url);
        }
        
        // For _next assets, let them through
        return NextResponse.next();
    }

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
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const checkUrl = `${apiUrl}/publication/check`;
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
