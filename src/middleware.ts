import { NextRequest, NextResponse } from 'next/server';

const getBackendBase = (request: NextRequest, hostname: string) => {
  const envBase =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL;

  if (envBase) return envBase.replace(/\/$/, '');

  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${hostname}:5000`;
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
    // If accessing root of dashboard subdomain, redirect to /dashboard (keeps URL + pathname in sync)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Server-side "new user" redirect: if a signed-in user has no publication,
    // send them to create-publication before rendering the dashboard.
    if (request.method === 'GET' && pathname === '/dashboard') {
      try {
        const apiBase = getBackendBase(request, cleanHost);
        const cookie = request.headers.get('cookie') || '';

        // If there are no cookies at all, avoid the backend roundtrip.
        if (cookie) {
          const pubRes = await fetch(`${apiBase}/api/publications/check`, {
            headers: { cookie, accept: 'application/json' },
            cache: 'no-store',
          });

          if (pubRes.ok) {
            const data = await pubRes.json().catch(() => null);
            if (data && data.hasPublication === false) {
              return NextResponse.redirect(new URL('/create-publication', request.url));
            }
          }
        }
      } catch {
        // If the check fails, fall through to client-side guards.
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
