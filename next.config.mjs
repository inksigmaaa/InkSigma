/** @type {import('next').NextConfig} */
// BACKEND_URL must resolve to the actual backend server.
// Use the onrender.com URL until api.inksigma.xyz points to Render.
const backendUrl = (
  process.env.BACKEND_URL || 'http://localhost:5000'
).replace(/\/$/, '');

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
