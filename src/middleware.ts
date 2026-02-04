import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_PUB_COOKIE = 'inksigma_dashboard_pub';

// Routes that must remain un-prefixed even on the dashboard host.
const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/magic-link',
  '/auth-callback',
  '/create-publication',
  '/invite',
  '/view-site',
  '/profile-settings', // User-level settings, not publication-specific
];

// "Old" (non-prefixed) dashboard endpoints. If users navigate to these directly on the
// dashboard host, we can redirect to /{pubSubdomain}/{endpoint} when we know the pub.
const DASHBOARD_ENDPOINT_PREFIXES = [
  '/home',
  '/posts',
  '/review',
  '/author-review',
  '/editor',
  '/draft',
  '/published',
  '/unpublished',
  '/trash',
  '/schedule',
  '/members',
  '/my-blogs',
  '/domain',
  // Legacy dashboard paths (we normalize these below)
  '/dashboard',
];

const getBackendBase = (request: NextRequest, hostname: string) => {
  const envBase =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL;

  if (envBase) return envBase.replace(/\/$/, '');

  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${hostname}:5000`;
};

const isPublicPath = (pathname: string) =>
  PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isOldDashboardEndpointPath = (pathname: string) =>
  DASHBOARD_ENDPOINT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const toInternalDashboardPath = (endpointPath: string) => {
  // Some pages live under /dashboard/* in the app router.
  if (endpointPath === '/settings' || endpointPath.startsWith('/settings/')) {
    return `/dashboard${endpointPath}`;
  }
  if (endpointPath === '/publications' || endpointPath.startsWith('/publications/')) {
    return `/dashboard${endpointPath}`;
  }

  return endpointPath;
};

const urlWithPathname = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return url;
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0]; // Remove port if present
  
  // Remove www prefix if present
  const cleanHost = hostname.replace(/^www\./, '');
  
  // Development environment handling
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
  const pathname = request.nextUrl.pathname;
  
  // Dashboard subdomain
  const isDashboardHost =
    cleanHost === `dashboard.${rootDomain}` ||
    (isDev && cleanHost === 'dashboard.localhost');

  if (isDashboardHost) {
    const apiBase = getBackendBase(request, cleanHost);
    const cookieHeader = request.headers.get('cookie') || '';
    const lastPubSub = request.cookies.get(DASHBOARD_PUB_COOKIE)?.value;

    // Server-side "new user" redirect:
    // If a signed-in user has *no owned OR joined publications*, send them to create-publication.
    // (Uses /api/members/user/publications so invited members don't get blocked.)
    if (request.method === 'GET' && !isPublicPath(pathname)) {
      try {
        // If there are no cookies at all, avoid the backend roundtrip.
        if (cookieHeader) {
          const pubsRes = await fetch(`${apiBase}/api/members/user/publications`, {
            headers: { cookie: cookieHeader, accept: 'application/json' },
            cache: 'no-store',
          });

          if (pubsRes.ok) {
            const data = await pubsRes.json().catch(() => null);
            const pubs = Array.isArray(data) ? data : data?.publications || [];
            if (Array.isArray(pubs) && pubs.length === 0) {
              return NextResponse.redirect(urlWithPathname(request, '/create-publication'));
            }
          }
          // If unauthorized (no session), fall through to client-side auth handling.
        }
      } catch {
        // If the check fails, fall through to client-side guards.
      }
    }

    // Normalize legacy /dashboard URLs to the new shape.
    // We can't know the pub for sure without state; if we have a cookie, use it.
    if (pathname === '/dashboard') {
      return NextResponse.redirect(urlWithPathname(request, '/'));
    }
    if (pathname.startsWith('/dashboard/')) {
      const rest = pathname.slice('/dashboard'.length); // includes leading '/'
      if (lastPubSub) {
        // /dashboard/settings -> /{pub}/settings
        return NextResponse.redirect(urlWithPathname(request, `/${lastPubSub}${rest}`));
      }
      // Fall back to the non-prefixed path (still works)
      return NextResponse.redirect(urlWithPathname(request, rest));
    }

    // Canonical dashboard entry:
    // Render the dashboard picker at "/" (internally served by /dashboard).
    if (pathname === '/') {
      const res = NextResponse.rewrite(urlWithPathname(request, '/dashboard'));
      return res;
    }

    // If user navigates to an old endpoint URL (e.g. /home) and we know their publication,
    // redirect to /{pub}/home (so the URL always contains the publication).
    if (!isPublicPath(pathname) && isOldDashboardEndpointPath(pathname) && lastPubSub) {
      return NextResponse.redirect(urlWithPathname(request, `/${lastPubSub}${pathname}`));
    }

    // Treat /{pubSubdomain}/{endpoint} as the public dashboard URL shape.
    // Internally we render existing routes (mostly /{endpoint} and some /dashboard/{endpoint}).
    if (!isPublicPath(pathname) && !isOldDashboardEndpointPath(pathname)) {
      const segments = pathname.split('/').filter(Boolean);
      const pubSub = segments[0];
      const rest = segments.slice(1);

      // Enforce /{pub}/{endpoint} shape
      if (rest.length === 0) {
        const res = NextResponse.redirect(urlWithPathname(request, `/${pubSub}/home`));
        res.cookies.set(DASHBOARD_PUB_COOKIE, pubSub, {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        return res;
      }

      const endpointPath = `/${(rest.length ? rest : ['home']).join('/')}`;
      const internalPath = toInternalDashboardPath(endpointPath);

      const res = NextResponse.rewrite(urlWithPathname(request, internalPath));
      // Keep server-side cookie in sync so we can normalize old links.
      res.cookies.set(DASHBOARD_PUB_COOKIE, pubSub, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }
  }
  
  // Handle publication subdomains (e.g., tyson.localhost:3000)
  const subdomainMatch = cleanHost.match(/^([a-zA-Z0-9-]+)\.localhost$/);
  if (subdomainMatch && isDev && !isDashboardHost) {
    const [, subdomain] = subdomainMatch;
    
    // Don't route dashboard subdomain or reserved subdomains
    if (subdomain !== 'dashboard' && subdomain !== 'www') {
      // Route all publication subdomain requests to view-site with subdomain parameter
      const viewSiteUrl = new URL(request.url);
      viewSiteUrl.pathname = '/view-site';
      viewSiteUrl.searchParams.set('subdomain', subdomain);
      
      return NextResponse.rewrite(viewSiteUrl);
    }
  }
  
  // Handle production publication subdomains (e.g., tyson.inksigma.com)
  if (!isDev && cleanHost.endsWith('.inksigma.com') && cleanHost !== 'www.inksigma.com') {
    const subdomain = cleanHost.replace('.inksigma.com', '');
    
    // Route all publication subdomain requests to view-site with subdomain parameter
    const viewSiteUrl = new URL(request.url);
    viewSiteUrl.pathname = '/view-site';
    viewSiteUrl.searchParams.set('subdomain', subdomain);
    
    return NextResponse.rewrite(viewSiteUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude static assets in /public (images/icons/svg/etc) and any path with a file extension.
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|images|icons|svg|editor-icons|.*\\..*).*)',
  ],
};
