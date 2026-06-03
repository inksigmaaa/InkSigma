/**
 * CORS middleware with credentialed allowlists for app origins
 * and non-credentialed access for public read routes.
 */

import cors, { type CorsOptions } from "cors";
import logger from "../utils/logger.js";
import { normalizeConfiguredDomainValue, parseConfiguredDomains } from "../utils/domainConfig.js";

const EXPOSED_HEADERS = ["X-Subdomain"];
const DEFAULT_DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://dashboard.localhost:3000",
  "http://inksigma.local:3000",
  "http://dashboard.inksigma.local:3000",
];

const parseConfiguredOrigins = (value: string | undefined, source: string) => {
  const origins = new Set<string>();

  for (const rawOrigin of (value || "").split(",")) {
    const origin = rawOrigin.trim();
    if (!origin) continue;

    if (origin.includes("*")) {
      logger.warn(
        { origin, source },
        "Ignoring wildcard CORS origin because credentialed requests require explicit allowlists",
      );
      continue;
    }

    try {
      origins.add(new URL(origin).origin);
    } catch {
      logger.warn({ origin, source }, "Ignoring invalid CORS origin");
    }
  }

  return origins;
};

const buildExplicitAllowList = () => {
  const environment = process.env.NODE_ENV || "development";
  const configuredOrigins =
    process.env.CORS_ORIGIN ||
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    "";
  const origins = new Set<string>();

  for (const origin of parseConfiguredOrigins(configuredOrigins, "env")) {
    origins.add(origin);
  }

  if (environment !== "production") {
    for (const origin of DEFAULT_DEVELOPMENT_ORIGINS) {
      origins.add(origin);
    }
  }

  if (environment === "production" && origins.size === 0) {
    logger.warn(
      "No explicit production CORS origins configured; credentialed browser requests will be rejected",
    );
  }

  return origins;
};

const explicitAllowList = buildExplicitAllowList();

const normalizeOrigin = (origin: string | undefined) => {
  if (!origin) return null;

  try {
    const url = new URL(origin);
    return url.origin;
  } catch {
    return null;
  }
};

const getPlatformDomains = () => {
  const configuredBaseDomains =
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    process.env.NEXT_PUBLIC_BASE_DOMAINS ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    "localhost,inksigma.local";
  const mainDomain = (
    process.env.MAIN_DOMAIN ||
    process.env.NEXT_PUBLIC_MAIN_DOMAIN ||
    "inksigma.xyz"
  );

  return Array.from(
    new Set(
      parseConfiguredDomains(configuredBaseDomains).concat(
        normalizeConfiguredDomainValue(mainDomain) || "inksigma.xyz",
      ),
    ),
  );
};

const platformDomains = getPlatformDomains();

const isPlatformOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin);
    const normalizedHostname = hostname.toLowerCase();

    return platformDomains.some((domain) => {
      if (normalizedHostname === domain) return true;

      const suffix = `.${domain}`;
      if (!normalizedHostname.endsWith(suffix)) return false;

      // Only allow single-level subdomains (e.g., "blog.inksigma.com").
      // Block nested subdomains (e.g., "evil.nested.inksigma.com") to prevent
      // attacker-controlled origins from gaining credentialed CORS access.
      const subdomain = normalizedHostname.slice(0, -suffix.length);
      return subdomain.length > 0 && !subdomain.includes(".");
    });
  } catch {
    return false;
  }
};

// Is this origin one of our own app origins (explicit allowlist or a platform
// domain / single-level subdomain)? Reused to validate user-supplied redirect
// targets so reset/verify links can't be pointed at attacker-controlled domains.
export const isTrustedAppOrigin = (origin: string | undefined): boolean => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return explicitAllowList.has(normalized) || isPlatformOrigin(normalized);
};

const isPublicCorsRequest = (req) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return (
      req.path === "/api/blogs" ||
      req.path.startsWith("/api/blogs/") ||
      req.path.startsWith("/api/publications/") ||
      req.path.startsWith("/api/comments/blog/") ||
      req.path === "/health" ||
      req.path === "/ready"
    );
  }

  return req.method === "POST" && req.path === "/api/views/track";
};

const resolveCorsOptions = (req): CorsOptions => {
  const requestOrigin = normalizeOrigin(req.header("origin"));

  if (!requestOrigin) {
    return {
      origin: true,
      credentials: false,
      exposedHeaders: EXPOSED_HEADERS,
    };
  }

  if (explicitAllowList.has(requestOrigin) || isPlatformOrigin(requestOrigin)) {
    return {
      origin: requestOrigin,
      credentials: true,
      exposedHeaders: EXPOSED_HEADERS,
    };
  }

  if (isPublicCorsRequest(req)) {
    return {
      origin: requestOrigin,
      credentials: false,
      exposedHeaders: EXPOSED_HEADERS,
    };
  }

  logger.warn({ origin: requestOrigin, path: req.path }, "Rejected CORS origin");
  return {
    origin: false,
    credentials: false,
    exposedHeaders: EXPOSED_HEADERS,
  };
};

export const corsMiddleware = cors((req, callback) => {
  callback(null, resolveCorsOptions(req));
});
