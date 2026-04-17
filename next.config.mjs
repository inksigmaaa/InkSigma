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

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
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
