/** @type {import('next').NextConfig} */
// BACKEND_URL must resolve to the actual backend server.
// Do not point it at this Vercel app (including api.<base-domain>) or the
// /api/* rewrites recurse until Vercel returns 508 INFINITE_LOOP_DETECTED.
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

const normalizeDomain = (domain) =>
  domain
    ?.trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase();

const getConfiguredBaseDomains = () => {
  const configured =
    process.env.NEXT_PUBLIC_BASE_DOMAINS ||
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    '';

  return configured
    .split(',')
    .map(normalizeDomain)
    .filter(Boolean);
};

const getFrontendHosts = () => {
  const hosts = new Set();

  const addUrlHost = (value) => {
    if (!value) return;
    try {
      hosts.add(new URL(value).hostname.toLowerCase());
    } catch {
      const host = normalizeDomain(value);
      if (host) hosts.add(host);
    }
  };

  addUrlHost(process.env.NEXT_PUBLIC_APP_URL);
  addUrlHost(process.env.FRONTEND_URL);
  addUrlHost(process.env.VERCEL_URL);
  addUrlHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  for (const domain of getConfiguredBaseDomains()) {
    hosts.add(domain);
    hosts.add(`www.${domain}`);
    hosts.add(`dashboard.${domain}`);
  }

  return hosts;
};

const getBackendUrl = () => {
  const explicitBackendUrl = process.env.BACKEND_URL?.trim();
  const localFallbackUrl = !isVercel
    ? process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim()
    : '';
  const rawBackendUrl =
    explicitBackendUrl ||
    localFallbackUrl ||
    (!isProduction ? 'http://localhost:5000' : '');

  if (!rawBackendUrl) {
    throw new Error(
      'BACKEND_URL is required for production frontend deploys. Set it to the real backend origin, for example the Render service URL, not a Vercel/frontend domain.',
    );
  }

  let parsed;
  try {
    parsed = new URL(rawBackendUrl);
  } catch {
    throw new Error(`Invalid BACKEND_URL: "${rawBackendUrl}"`);
  }

  const backendHost = parsed.hostname.toLowerCase();
  const frontendHosts = getFrontendHosts();
  const apiAliasHosts = getConfiguredBaseDomains().map(
    (domain) => `api.${domain}`,
  );

  if (isVercel && !explicitBackendUrl) {
    throw new Error(
      'Vercel deploys must set BACKEND_URL explicitly. NEXT_PUBLIC_BACKEND_URL is browser-facing config and must not drive server rewrites.',
    );
  }

  if (isVercel && frontendHosts.has(backendHost)) {
    throw new Error(
      `BACKEND_URL points at the frontend host "${backendHost}", which would create a Vercel rewrite loop.`,
    );
  }

  if (isVercel && apiAliasHosts.includes(backendHost)) {
    console.warn(
      `BACKEND_URL points at "${backendHost}". Make sure this host resolves to the backend service, not this Vercel frontend, or /api rewrites can produce 508 INFINITE_LOOP_DETECTED.`,
    );
  }

  return rawBackendUrl.replace(/\/$/, '');
};

const backendUrl = getBackendUrl();

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/auth/:path*',
          destination: `${backendUrl}/api/auth/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/health',
          destination: `${backendUrl}/health`,
        },
        {
          source: '/ready',
          destination: `${backendUrl}/ready`,
        },
        {
          source: '/uploads/:path*',
          destination: `${backendUrl}/uploads/:path*`,
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '**.inksigma.local',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.inksigma.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '**.inksigma.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.inksigma.xyz',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '**.inksigma.xyz',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.inksigma.xyz',
      },
    ],
  },
};

export default nextConfig;
