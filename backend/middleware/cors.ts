/**
 * CORS Middleware (Simplified)
 * Uses environment-based allowlist instead of parsing hosts
 */

import cors from "cors";

// Build allowlist from environment variables
const buildAllowList = () => {
  const fromEnv =
    process.env.CORS_ORIGIN ||
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  const origins = new Set(
    fromEnv
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  // Add common development origins
  if (process.env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://dashboard.localhost:3000");
    origins.add("http://inksigma.local:3000");
    origins.add("http://dashboard.inksigma.local:3000");
  }

  return origins;
};

const allowList = buildAllowList();

// Get base domains for wildcard matching
const getBaseDomains = () => {
  const envValue =
    process.env.BASE_DOMAINS || process.env.BASE_DOMAIN || "localhost,inksigma.local";
  return envValue
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
};

const baseDomains = getBaseDomains();

/**
 * Check if an origin is allowed
 * Allows any subdomain of configured base domains
 */
const isOriginAllowed = (origin) => {
  // No origin (same-origin or non-browser request)
  if (!origin) return true;

  // Explicitly allowed
  if (allowList.has(origin)) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    if (
      process.env.NODE_ENV === "development" &&
      (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local"))
    ) {
      return true;
    }

    // Allow any subdomain of base domains
    for (const baseDomain of baseDomains) {
      if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
        return true;
      }
    }

    // Allow inksigma.com and subdomains in production
    if (hostname === "inksigma.com" || hostname.endsWith(".inksigma.com")) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

// CORS configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  exposedHeaders: ["X-Subdomain"],
});
