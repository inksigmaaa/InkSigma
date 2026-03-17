import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PUB_COOKIE = "inksigma_dashboard_pub";

// Routes that must remain un-prefixed even on the dashboard host.
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/magic-link",
  "/auth-callback",
  "/create-publication",
  "/invite",
  "/view-site",
];

// "Old" (non-prefixed) dashboard endpoints. If users navigate to these directly on the
// dashboard host, we can redirect to /{pubSubdomain}/{endpoint} when we know the pub.
const DASHBOARD_ENDPOINT_PREFIXES = [
  "/home",
  "/allArticle",
  "/review",
  "/author-review",
  "/editor",
  "/draft",
  "/published",
  "/unpublished",
  "/trash",
  "/schedule",
  "/members",
  "/my-blogs",
  "/profile-settings",
  "/domain",
  // Legacy dashboard paths (we normalize these below)
  "/dashboard",
];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isOldDashboardEndpointPath = (pathname: string) =>
  DASHBOARD_ENDPOINT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isKnownBaseDomain = (
  host: string,
  rootDomain: string,
  mainDomain: string,
): boolean => {
  const normalizedHost = host.split(":")[0].replace(/^www\./, "").toLowerCase();

  return [
    rootDomain,
    mainDomain,
    `dashboard.${rootDomain}`,
    `dashboard.${mainDomain}`,
    "localhost",
    "dashboard.localhost",
  ].includes(normalizedHost);
};

const toInternalDashboardPath = (endpointPath: string) => {
  // Some pages live under /dashboard/* in the app router.

  if (
    endpointPath === "/publications" ||
    endpointPath.startsWith("/publications/")
  ) {
    return `/dashboard${endpointPath}`;
  }

  return endpointPath;
};

const urlWithPathname = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return url;
};

const getBackendBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");
};

const isLocalLikeHost = (host: string) => {
  const normalized = host.split(":")[0].toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  );
};

const buildRedirectUrlForHost = (
  request: NextRequest,
  canonicalHost: string,
) => {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.hostname = canonicalHost;

  if (process.env.NODE_ENV === "development" || isLocalLikeHost(canonicalHost)) {
    redirectUrl.port = request.nextUrl.port || "3000";
  } else {
    redirectUrl.port = "";
  }

  return redirectUrl;
};

const fetchHostRouting = async (host: string) => {
  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/publications/resolve-host?host=${encodeURIComponent(host)}`,
      {
        headers: {
          "x-middleware-host-lookup": "1",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

const rewriteToViewSite = (
  request: NextRequest,
  requestHeaders: Headers,
  params: { subdomain?: string; customDomain?: string },
) => {
  const viewSiteUrl = new URL(request.url);
  const pathname = viewSiteUrl.pathname;

  if (pathname === "/") {
    viewSiteUrl.pathname = "/view-site";
  } else if (pathname.startsWith("/view-site")) {
    viewSiteUrl.pathname = pathname;
  } else {
    viewSiteUrl.pathname = `/view-site${pathname}`;
  }

  if (params.subdomain) {
    viewSiteUrl.searchParams.set("subdomain", params.subdomain);
  }
  if (params.customDomain) {
    viewSiteUrl.searchParams.set("customDomain", params.customDomain);
  }

  return NextResponse.rewrite(viewSiteUrl, {
    request: { headers: requestHeaders },
  });
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const cleanHost = hostname.replace(/^www\./, "").toLowerCase();

  const isDev = process.env.NODE_ENV === "development";
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost"
  ).toLowerCase();
  const mainDomain = (
    process.env.NEXT_PUBLIC_MAIN_DOMAIN || "inksigma.com"
  ).toLowerCase();
  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-invoke-path", pathname);
  requestHeaders.set("x-url", request.url);

  const isDashboardHost =
    cleanHost === `dashboard.${rootDomain}` ||
    cleanHost === "dashboard.localhost" ||
    cleanHost === `dashboard.${mainDomain}`;

  if (isDashboardHost) {
    const lastPubSub = request.cookies.get(DASHBOARD_PUB_COOKIE)?.value;

    // Server-side "new user" redirect removed for performance.
    // Now handled client-side in PublicationContext to avoid blocking requests.

    // Normalize legacy /dashboard URLs to the new shape.
    // We can't know the pub for sure without state; if we have a cookie, use it.
    if (pathname === "/dashboard") {
      return NextResponse.redirect(urlWithPathname(request, "/"));
    }
    if (pathname.startsWith("/dashboard/")) {
      const rest = pathname.slice("/dashboard".length); // includes leading '/'
      if (lastPubSub) {
        // /dashboard/settings -> /{pub}/settings
        return NextResponse.redirect(
          urlWithPathname(request, `/${lastPubSub}${rest}`),
        );
      }
      // Fall back to the non-prefixed path (still works)
      return NextResponse.redirect(urlWithPathname(request, rest));
    }

    // Canonical dashboard entry:
    // Render the dashboard picker at "/" (internally served by /dashboard).
    if (pathname === "/") {
      const res = NextResponse.rewrite(urlWithPathname(request, "/dashboard"), {
        request: { headers: requestHeaders },
      });
      return res;
    }

    // If user navigates to an old endpoint URL (e.g. /home) and we know their publication,
    // redirect to /{pub}/home (so the URL always contains the publication).
    if (
      !isPublicPath(pathname) &&
      isOldDashboardEndpointPath(pathname) &&
      lastPubSub
    ) {
      return NextResponse.redirect(
        urlWithPathname(request, `/${lastPubSub}${pathname}`),
      );
    }

    // Treat /{pubSubdomain}/{endpoint} as the public dashboard URL shape.
    // Internally we render existing routes (mostly /{endpoint} and some /dashboard/{endpoint}).
    if (!isPublicPath(pathname) && !isOldDashboardEndpointPath(pathname)) {
      const segments = pathname.split("/").filter(Boolean);
      const pubSub = segments[0];
      const rest = segments.slice(1);

      // Enforce /{pub}/{endpoint} shape
      if (rest.length === 0) {
        const res = NextResponse.redirect(
          urlWithPathname(request, `/${pubSub}/home`),
        );
        res.cookies.set(DASHBOARD_PUB_COOKIE, pubSub, {
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        return res;
      }

      const endpointPath = `/${(rest.length ? rest : ["home"]).join("/")}`;
      const internalPath = toInternalDashboardPath(endpointPath);

      const res = NextResponse.rewrite(urlWithPathname(request, internalPath), {
        request: { headers: requestHeaders },
      });
      // Keep server-side cookie in sync so we can normalize old links.
      res.cookies.set(DASHBOARD_PUB_COOKIE, pubSub, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }
  }

  // Handle root domain - show landing page
  if (
    cleanHost === rootDomain ||
    cleanHost === mainDomain ||
    cleanHost === `www.${rootDomain}` ||
    cleanHost === `www.${mainDomain}`
  ) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const hostRouting = await fetchHostRouting(cleanHost);

  if (hostRouting?.shouldRedirect && hostRouting?.canonicalHost) {
    return NextResponse.redirect(
      buildRedirectUrlForHost(request, hostRouting.canonicalHost),
      308,
    );
  }

  // Handle publication subdomains (both rootDomain and mainDomain)
  const isSubdomainForRoot =
    cleanHost.endsWith(`.${rootDomain}`) &&
    cleanHost !== `www.${rootDomain}` &&
    !isDashboardHost;

  const isSubdomainForMain =
    cleanHost.endsWith(`.${mainDomain}`) &&
    cleanHost !== `www.${mainDomain}` &&
    !cleanHost.startsWith(`dashboard.`) &&
    !isDashboardHost;

  if (isSubdomainForRoot) {
    const subdomain = cleanHost.replace(`.${rootDomain}`, "");

    if (
      subdomain !== "dashboard" &&
      subdomain !== "www" &&
      subdomain !== "api"
    ) {
      return rewriteToViewSite(request, requestHeaders, { subdomain });
    }
  }

  if (isSubdomainForMain) {
    const subdomain = cleanHost.replace(`.${mainDomain}`, "");

    if (
      subdomain !== "dashboard" &&
      subdomain !== "www" &&
      subdomain !== "api"
    ) {
      return rewriteToViewSite(request, requestHeaders, { subdomain });
    }
  }

  // Handle custom domains
  // If we reach here, the host doesn't match any known base domains
  // This is a custom domain - route to view-site with customDomain parameter
  if (!isKnownBaseDomain(cleanHost, rootDomain, mainDomain)) {
    return rewriteToViewSite(request, requestHeaders, {
      customDomain: cleanHost,
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    // Exclude static assets in /public (images/icons/svg/etc) and any path with a file extension.
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|images|icons|svg|editor-icons|.*\\..*).*)",
  ],
};
