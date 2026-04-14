/**
 * CORS middleware with credentialed allowlists for app origins,
 * platform subdomain matching, verified custom domain support,
 * and non-credentialed access for public read routes.
 */

import type { Request, Response, NextFunction } from "express";
import cors, { type CorsOptions } from "cors";
import logger from "../utils/logger.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPOSED_HEADERS = ["X-Subdomain", "X-Request-Id"];
const ALLOWED_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const PREFLIGHT_MAX_AGE = 7200; // 2 hours — Chrome's maximum

const DEFAULT_DEVELOPMENT_ORIGINS =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://dashboard.localhost:3000",
        "http://inksigma.local:3000",
        "http://dashboard.inksigma.local:3000",
      ];

// ---------------------------------------------------------------------------
// Origin allowlist (computed once at startup)
// ---------------------------------------------------------------------------

const parseConfiguredOrigins = (value: string | undefined, source: string): Set<string> => {
  const origins = new Set<string>();

  for (const rawOrigin of (value || "").split(",")) {
    const origin = rawOrigin.trim();
    if (!origin) continue;

    if (origin.includes("*")) {
      logger.warn(
        { origin, source },
        "Ignoring wildcard CORS origin — credentialed requests require explicit allowlists",
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

const buildExplicitAllowList = (): Set<string> => {
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

// ---------------------------------------------------------------------------
// Platform domain matching
// ---------------------------------------------------------------------------

const getPlatformDomains = (): string[] => {
  const configuredBaseDomains =
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    process.env.NEXT_PUBLIC_BASE_DOMAINS ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost,inksigma.local");
  const mainDomain = (
    process.env.MAIN_DOMAIN ||
    process.env.NEXT_PUBLIC_MAIN_DOMAIN ||
    "inksigma.com"
  ).toLowerCase();

  return Array.from(
    new Set(
      configuredBaseDomains
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean)
        .concat(mainDomain),
    ),
  );
};

const platformDomains = getPlatformDomains();

const normalizeOrigin = (origin: string | undefined): string | null => {
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
};

const isPlatformOrigin = (origin: string): boolean => {
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

// ---------------------------------------------------------------------------
// Custom domain verification cache
// ---------------------------------------------------------------------------
// Verified custom domains (e.g., myblog.com) need credentialed CORS access
// to the API. We cache verified domains in-memory with a short TTL to avoid
// DB lookups on every preflight.
// ---------------------------------------------------------------------------

const verifiedDomainCache = new Map<string, { allowed: boolean; expiresAt: number }>();
const DOMAIN_CACHE_TTL_MS = 120_000; // 2 minutes
const DOMAIN_CACHE_MAX_SIZE = 1_000;

let resolveCustomDomainFn:
  | ((domain: string) => Promise<unknown | null>)
  | null = null;

/**
 * Register the custom domain resolver. Called once from app.ts after
 * the publication resolver is available, to avoid circular imports.
 */
export const setCustomDomainResolver = (
  resolver: (domain: string) => Promise<unknown | null>,
): void => {
  resolveCustomDomainFn = resolver;
};

const isVerifiedCustomDomain = async (hostname: string): Promise<boolean> => {
  if (!resolveCustomDomainFn) return false;

  const now = Date.now();
  const cached = verifiedDomainCache.get(hostname);
  if (cached && now < cached.expiresAt) return cached.allowed;

  try {
    const publication = await resolveCustomDomainFn(hostname);
    const allowed = publication !== null;

    // Evict oldest entries if cache is full.
    if (verifiedDomainCache.size >= DOMAIN_CACHE_MAX_SIZE) {
      const firstKey = verifiedDomainCache.keys().next().value;
      if (firstKey) verifiedDomainCache.delete(firstKey);
    }

    verifiedDomainCache.set(hostname, { allowed, expiresAt: now + DOMAIN_CACHE_TTL_MS });
    return allowed;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Public route detection
// ---------------------------------------------------------------------------

const isPublicCorsRequest = (req: Request): boolean => {
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

// ---------------------------------------------------------------------------
// CORS options resolver
// ---------------------------------------------------------------------------

/**
 * Synchronous CORS options resolver.
 *
 * The `cors` npm package callback must be invoked synchronously —
 * async callbacks create a race where Express proceeds before headers
 * are set. The allowlist and platform domain checks are all synchronous.
 * Custom domain verification is deferred to an Express-level async
 * middleware that runs before the cors callback.
 */
const resolveCorsOptions = (req: Request): CorsOptions => {
  const requestOrigin = normalizeOrigin(req.header("origin"));

  // No Origin header — same-origin or non-browser client.
  if (!requestOrigin) {
    return {
      origin: true,
      credentials: false,
      exposedHeaders: EXPOSED_HEADERS,
    };
  }

  const baseOptions: Partial<CorsOptions> = {
    exposedHeaders: EXPOSED_HEADERS,
    methods: ALLOWED_METHODS,
    maxAge: PREFLIGHT_MAX_AGE,
  };

  // 1. Explicit allowlist or platform subdomain — full credentialed access.
  if (explicitAllowList.has(requestOrigin) || isPlatformOrigin(requestOrigin)) {
    return { ...baseOptions, origin: requestOrigin, credentials: true };
  }

  // 2. Verified custom domain (synchronous in-memory cache lookup).
  try {
    const { hostname } = new URL(requestOrigin);
    const cached = verifiedDomainCache.get(hostname.toLowerCase());
    if (cached && Date.now() < cached.expiresAt && cached.allowed) {
      return { ...baseOptions, origin: requestOrigin, credentials: true };
    }
  } catch {
    // Invalid origin URL — fall through.
  }

  // 3. Public read routes — non-credentialed access.
  if (isPublicCorsRequest(req)) {
    return { ...baseOptions, origin: requestOrigin, credentials: false };
  }

  // 4. Rejected.
  logger.warn({ origin: requestOrigin, path: req.path }, "Rejected CORS origin");
  return { origin: false, credentials: false, exposedHeaders: EXPOSED_HEADERS };
};

// ---------------------------------------------------------------------------
// Custom domain warm-up middleware
// ---------------------------------------------------------------------------

export const customDomainCorsWarmup = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!resolveCustomDomainFn) {
    next();
    return;
  }

  const requestOrigin = normalizeOrigin(req.header("origin"));
  if (!requestOrigin) {
    next();
    return;
  }

  if (explicitAllowList.has(requestOrigin) || isPlatformOrigin(requestOrigin)) {
    next();
    return;
  }

  try {
    const { hostname } = new URL(requestOrigin);
    await isVerifiedCustomDomain(hostname.toLowerCase());
  } catch {
    // Ignore — cors callback will handle rejection.
  }

  next();
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const corsMiddleware = cors((req, callback) => {
  callback(null, resolveCorsOptions(req as Request));
});
