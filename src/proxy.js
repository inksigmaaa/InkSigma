import { NextResponse } from "next/server";

const HAS_PUBLICATION_COOKIE = "inksigma.has_publication";

const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/magic-link",
];

const publicPaths = ["/view-site"];
const skipPublicationCheck = ["/create-publication", "/profile-settings"];

export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const isPublicRoute = publicRoutes.includes(pathname);
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
    const sessionToken = request.cookies.get("better-auth.session_token");
    const publicationCookie = request.cookies.get(HAS_PUBLICATION_COOKIE)?.value === "1";

    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/icons") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    if (!isPublicRoute && !isPublicPath && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isPublicRoute && pathname !== "/" && sessionToken) {
        return NextResponse.redirect(new URL("/home", request.url));
    }

    if (!sessionToken || isPublicRoute || isPublicPath) {
        return NextResponse.next();
    }

    const shouldCheckPublication = !skipPublicationCheck.some((path) => pathname.startsWith(path));

    if (!shouldCheckPublication || publicationCookie) {
        return NextResponse.next();
    }

    try {
        const checkUrl = new URL("/api/publication/check", request.url);
        const response = await fetch(checkUrl, {
            headers: {
                Cookie: `better-auth.session_token=${sessionToken.value}`,
            },
        });

        if (!response.ok) {
            return NextResponse.next();
        }

        const data = await response.json();

        if (!data.hasPublication) {
            return NextResponse.redirect(new URL("/create-publication", request.url));
        }

        const nextResponse = NextResponse.next();
        nextResponse.cookies.set(HAS_PUBLICATION_COOKIE, "1", {
            httpOnly: true,
            maxAge: 60 * 30,
            path: "/",
            sameSite: "lax",
        });
        return nextResponse;
    } catch (error) {
        console.error("Error checking publication:", error);
        return NextResponse.next();
    }
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
