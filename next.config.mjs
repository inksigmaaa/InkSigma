const backendOrigin =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "";

const backendRemotePatterns = [];

if (backendOrigin) {
  try {
    const backendUrl = new URL(backendOrigin);
    backendRemotePatterns.push({
      protocol: backendUrl.protocol.replace(":", ""),
      hostname: backendUrl.hostname,
      port: backendUrl.port || undefined,
      pathname: "/**",
    });
  } catch {
    // Ignore malformed backend origin and fall back to static patterns below.
  }
}

backendRemotePatterns.push(
  {
    protocol: "http",
    hostname: "localhost",
    port: "5000",
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "5000",
    pathname: "/**",
  },
);

// Security response headers applied to every Next-served document/route.
// HSTS/nosniff/frame/referrer/permissions are non-breaking and safe to enforce.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), browsing-topics=()" },
];

// CSP is shipped in REPORT-ONLY mode first: it never blocks, it only reports
// violations, so we can collect telemetry and tune before enforcing. `script-src`
// still allows 'unsafe-inline'/'unsafe-eval' (Next runtime + dev) and must be
// migrated to a nonce-based policy before switching to an enforcing
// `Content-Security-Policy` header.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://i.pravatar.cc" +
    (backendOrigin ? ` ${backendOrigin}` : ""),
  "font-src 'self' data:",
  "connect-src 'self'" + (backendOrigin ? ` ${backendOrigin}` : ""),
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
    ];
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
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      ...backendRemotePatterns,
    ],
  },
};

export default nextConfig;
