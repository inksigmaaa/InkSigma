import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PUB_COOKIE = "inksigma_dashboard_pub";
const RESERVED_SUBDOMAINS = new Set(["dashboard", "www", "api"]);

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
  "/blog",
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
  baseDomains: string[],
): boolean => {
  const normalizedHost = host.split(":")[0].replace(/^www\./, "").toLowerCase();

  return baseDomains.some(
    (domain) =>
      normalizedHost === domain || normalizedHost === `dashboard.${domain}`,
  );
};

// ── Pre-computed at module level (persists across requests in Node.js runtime) ──

const getBaseDomains = () => {
  const configured =
    process.env.NEXT_PUBLIC_BASE_DOMAINS ||
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||   // singular NEXT_PUBLIC_ variant
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost,inksigma.local");

  return configured
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
};

// Pre-compute once at module init (Node.js runtime — survives across requests)
const _rootDomain = (
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost")
).toLowerCase();

const isLocalLikeHost = (host: string) => {
  const normalized = host.split(":")[0].toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  );
};

// When NEXT_PUBLIC_MAIN_DOMAIN is not explicitly set and we're not on localhost,
// use the root domain itself (e.g. the Vercel URL) rather than defaulting to inksigma.com.
const _configuredMainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN
  ? process.env.NEXT_PUBLIC_MAIN_DOMAIN.toLowerCase()
  : null;

const _mainDomain = isLocalLikeHost(_rootDomain)
  ? _rootDomain
  : (_configuredMainDomain ?? _rootDomain);

// Always include the root domain so the Vercel/custom URL is a known base domain.
const _baseDomains = Array.from(new Set([...getBaseDomains(), _mainDomain, _rootDomain]));

// Pre-sort by length descending (used for subdomain extraction)
const _baseDomainsSorted = [..._baseDomains].sort((a, b) => b.length - a.length);

// Pre-compute dashboard host set for O(1) lookup
const _dashboardHosts = new Set(_baseDomains.map((d) => `dashboard.${d}`));

// ── Host routing cache (in-process, TTL-based) ──

interface HostCacheEntry {
  data: any;
  expiry: number;
}

const HOST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for hits
const HOST_CACHE_MISS_TTL_MS = 30 * 1000; // 30 seconds for misses
const HOST_CACHE_MAX_SIZE = 500;

const hostCache = new Map<string, HostCacheEntry>();

const getCachedHostRouting = (host: string): any | undefined => {
  const entry = hostCache.get(host);
  if (!entry) return undefined;
  if (entry.expiry > Date.now()) return entry.data;
  hostCache.delete(host);
  return undefined;
};

const setCachedHostRouting = (host: string, data: any, ttlMs: number) => {
  // Evict oldest entries if cache is full
  if (hostCache.size >= HOST_CACHE_MAX_SIZE) {
    const firstKey = hostCache.keys().next().value;
    if (firstKey) hostCache.delete(firstKey);
  }
  hostCache.set(host, { data, expiry: Date.now() + ttlMs });
};

// ── End cache ──

const getSubdomainFromHost = (host: string) => {
  for (const baseDomain of _baseDomainsSorted) {
    const suffix = `.${baseDomain}`;
    if (!host.endsWith(suffix) || host === baseDomain) continue;

    const subdomain = host.slice(0, -suffix.length);
    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
      return null;
    }

    return subdomain;
  }

  return null;
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
  // Prefer BACKEND_URL (actual backend, e.g. Render) over NEXT_PUBLIC_BACKEND_URL
  // (which may point to api.inksigma.xyz → Vercel, causing a loop).
  return (
    process.env.BACKEND_URL ||
    (process.env.VERCEL === "1"
      ? undefined
      : process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL) ||
    "http://localhost:5000"
  ).replace(/\/$/, "");
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

const shouldApplyCanonicalRedirect = (currentHost: string, canonicalHost: string) => {
  const normalizedCurrentHost = currentHost.split(":")[0].toLowerCase();
  const normalizedCanonicalHost = canonicalHost.split(":")[0].toLowerCase();

  // In local development, do not redirect from local hosts to public domains.
  if (isLocalLikeHost(normalizedCurrentHost) && !isLocalLikeHost(normalizedCanonicalHost)) {
    return false;
  }

  return normalizedCurrentHost !== normalizedCanonicalHost;
};

const HOST_ROUTING_TIMEOUT_MS = 3000;

const fetchHostRouting = async (host: string) => {
  // Check in-process cache first
  const cached = getCachedHostRouting(host);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/publications/resolve-host?host=${encodeURIComponent(host)}`,
      {
        headers: {
          "x-middleware-host-lookup": "1",
        },
        signal: AbortSignal.timeout(HOST_ROUTING_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      // Cache misses briefly to avoid hammering backend
      setCachedHostRouting(host, null, HOST_CACHE_MISS_TTL_MS);
      return null;
    }

    const data = await response.json();
    setCachedHostRouting(host, data, HOST_CACHE_TTL_MS);
    return data;
  } catch {
    // Don't cache transient errors (network timeouts, etc.)
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

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const cleanHost = hostname.replace(/^www\./, "").toLowerCase();

  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-invoke-path", pathname);
  requestHeaders.set("x-url", request.url);

  // O(1) lookup instead of .some() on every request
  const isDashboardHost = _dashboardHosts.has(cleanHost);

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

  // Handle root domain
  if (_baseDomains.some((domain) => cleanHost === domain || cleanHost === `www.${domain}`)) {
    // In same-origin dashboard mode, treat non-landing non-public paths as dashboard requests.
    // The Next.js app router already has routes for /home, /allArticle, /dashboard, etc.
    // so we just pass through — no rewrite needed.
    if (
      process.env.NEXT_PUBLIC_SAME_ORIGIN_DASHBOARD === "true" &&
      pathname !== "/" &&
      !isPublicPath(pathname) &&
      !pathname.startsWith("/view-site")
    ) {
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      // Sync the publication cookie if this is a /{pubSubdomain}/{endpoint} style URL
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && !isOldDashboardEndpointPath(`/${segments[0]}`)) {
        res.cookies.set("inksigma_dashboard_pub", segments[0], {
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      return res;
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const hostRouting = await fetchHostRouting(cleanHost);

  if (hostRouting?.shouldRedirect && hostRouting?.canonicalHost) {
    if (!shouldApplyCanonicalRedirect(cleanHost, hostRouting.canonicalHost)) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.redirect(
      buildRedirectUrlForHost(request, hostRouting.canonicalHost),
      308,
    );
  }

  // Handle publication subdomains (both rootDomain and mainDomain)
  const detectedSubdomain = getSubdomainFromHost(cleanHost);
  if (detectedSubdomain && !isDashboardHost) {
    return rewriteToViewSite(request, requestHeaders, {
      subdomain: detectedSubdomain,
    });
  }

  // Handle custom domains
  // If we reach here, the host doesn't match any known base domains
  // This is a custom domain - route to view-site with customDomain parameter
  if (!isKnownBaseDomain(cleanHost, _baseDomains)) {
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
