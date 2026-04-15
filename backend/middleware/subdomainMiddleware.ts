import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import type { TenantContext } from "../types/express.js";
import {
  resolvePublicationBySubdomain,
  resolvePublicationByCustomDomain,
} from "../services/publicationResolver.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DASHBOARD_SUBDOMAIN = process.env.DASHBOARD_SUBDOMAIN || "dashboard";

const getLocalLikeBaseDomain = (): string | undefined =>
  (process.env.BASE_DOMAINS || process.env.BASE_DOMAIN || "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .find(
      (domain) =>
        domain === "localhost" ||
        domain.endsWith(".local") ||
        domain.endsWith(".localhost"),
    );

const MAIN_DOMAIN = (
  getLocalLikeBaseDomain() || process.env.MAIN_DOMAIN || "inksigma.xyz"
).toLowerCase();

const BASE_DOMAINS = (
  process.env.BASE_DOMAINS ||
  process.env.BASE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost,inksigma.local")
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

const RESERVED_SUBDOMAINS = new Set([
  "dashboard",
  "www",
  "api",
  "admin",
  "static",
  "assets",
  "cdn",
  "mail",
  "support",
  "help",
  "status",
]);

// ---------------------------------------------------------------------------
// In-memory LRU cache for tenant resolution
// ---------------------------------------------------------------------------
// Eliminates Redis/DB round-trips for repeatedly accessed subdomains
// (e.g., the dashboard, popular publications).
// ---------------------------------------------------------------------------

interface TenantCacheEntry {
  tenant: TenantContext;
  expiresAt: number;
}

const TENANT_CACHE_MAX_SIZE = 500;
const TENANT_CACHE_HIT_TTL_MS = 60_000;   // 60s for found publications
const TENANT_CACHE_MISS_TTL_MS = 30_000;  // 30s for negative results

const tenantCache = new Map<string, TenantCacheEntry>();

const getCachedTenant = (key: string): TenantContext | null => {
  const entry = tenantCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    tenantCache.delete(key);
    return null;
  }

  // Move to end of insertion order (LRU behavior).
  tenantCache.delete(key);
  tenantCache.set(key, entry);
  return entry.tenant;
};

const setCachedTenant = (key: string, tenant: TenantContext): void => {
  // Evict oldest entry if full.
  if (tenantCache.size >= TENANT_CACHE_MAX_SIZE) {
    const firstKey = tenantCache.keys().next().value;
    if (firstKey) tenantCache.delete(firstKey);
  }

  const ttl = tenant.publication ? TENANT_CACHE_HIT_TTL_MS : TENANT_CACHE_MISS_TTL_MS;
  tenantCache.set(key, { tenant, expiresAt: Date.now() + ttl });
};

// Periodic cleanup of expired entries.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tenantCache) {
    if (now > entry.expiresAt) {
      tenantCache.delete(key);
    }
  }
}, 30_000).unref();

// ---------------------------------------------------------------------------
// Host normalization
// ---------------------------------------------------------------------------

const normalizeHost = (rawHost: unknown): string => {
  if (!rawHost) return "";

  const trimmed = String(rawHost).trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0];

  // IPv6 literal
  if (withoutPath.startsWith("[")) {
    return withoutPath.slice(1).split("]")[0].toLowerCase();
  }

  // Strip port
  return withoutPath.split(":")[0];
};

const extractHostFromUrl = (rawValue: unknown): string => {
  if (!rawValue) return "";

  try {
    return normalizeHost(new URL(String(rawValue)).host);
  } catch {
    return normalizeHost(rawValue);
  }
};

// ---------------------------------------------------------------------------
// Tenant resolution
// ---------------------------------------------------------------------------

const ROOT_TENANT = (host: string): TenantContext => ({
  host,
  subdomain: null,
  customDomain: null,
  publication: null,
  type: "root",
  isDashboard: false,
  isReservedSubdomain: false,
  isCustomDomain: false,
});

const resolveTenantFromHost = async (host: string): Promise<TenantContext> => {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return ROOT_TENANT("");

  // Check in-memory cache first.
  const cached = getCachedTenant(normalizedHost);
  if (cached) return cached;

  const candidateBaseDomains = [...BASE_DOMAINS, MAIN_DOMAIN]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const baseDomain of candidateBaseDomains) {
    // Exact match = root domain.
    if (normalizedHost === baseDomain) {
      const tenant = ROOT_TENANT(normalizedHost);
      setCachedTenant(normalizedHost, tenant);
      return tenant;
    }

    const suffix = `.${baseDomain}`;
    if (!normalizedHost.endsWith(suffix)) continue;

    const subdomain = normalizedHost.slice(0, -suffix.length);
    const isDashboard = subdomain === DASHBOARD_SUBDOMAIN;
    const isReserved = RESERVED_SUBDOMAINS.has(subdomain);

    const tenant: TenantContext = {
      host: normalizedHost,
      subdomain,
      customDomain: null,
      publication:
        !isDashboard && !isReserved
          ? await resolvePublicationBySubdomain(subdomain)
          : null,
      type: isDashboard ? "dashboard" : "subdomain",
      isDashboard,
      isReservedSubdomain: isReserved,
      isCustomDomain: false,
    };

    setCachedTenant(normalizedHost, tenant);
    return tenant;
  }

  // Not a known base domain — treat as custom domain.
  const publication = await resolvePublicationByCustomDomain(normalizedHost);

  const tenant: TenantContext = {
    host: normalizedHost,
    subdomain: publication?.subdomain || null,
    customDomain: normalizedHost,
    publication,
    type: publication ? "custom-domain" : "unknown",
    isDashboard: false,
    isReservedSubdomain: false,
    isCustomDomain: true,
  };

  setCachedTenant(normalizedHost, tenant);
  return tenant;
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export const subdomainMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const explicitSubdomain = normalizeHost(req.headers["x-subdomain"]);
    const explicitCustomDomain = normalizeHost(req.headers["x-custom-domain"]);

    let tenant: TenantContext;

    if (explicitSubdomain) {
      // Check cache for explicit subdomain.
      const cached = getCachedTenant(`sub:${explicitSubdomain}`);
      if (cached) {
        tenant = cached;
      } else {
        const isDashboard = explicitSubdomain === DASHBOARD_SUBDOMAIN;
        const isReserved = RESERVED_SUBDOMAINS.has(explicitSubdomain);

        tenant = {
          host: explicitSubdomain,
          subdomain: explicitSubdomain,
          customDomain: null,
          publication:
            !isDashboard && !isReserved
              ? await resolvePublicationBySubdomain(explicitSubdomain)
              : null,
          type: isDashboard ? "dashboard" : "subdomain",
          isDashboard,
          isReservedSubdomain: isReserved,
          isCustomDomain: false,
        };
        setCachedTenant(`sub:${explicitSubdomain}`, tenant);
      }
    } else if (explicitCustomDomain) {
      tenant = await resolveTenantFromHost(explicitCustomDomain);
    } else {
      const forwardedHost = extractHostFromUrl(req.headers.origin);
      const refererHost = extractHostFromUrl(req.headers.referer);
      const requestHost = normalizeHost(
        req.headers["x-forwarded-host"] || req.headers.host,
      );
      const detectedHost = forwardedHost || refererHost || requestHost;

      tenant = await resolveTenantFromHost(detectedHost);
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    logger.error(error, "[SubdomainMiddleware] Error resolving tenant");

    // Allow health, readiness, and auth routes through without tenant context.
    // All other routes fail closed so that downstream authorization isn't bypassed.
    const safePathPrefixes = ["/health", "/ready", "/api/auth"];
    const isSafePath = safePathPrefixes.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    );

    if (isSafePath) {
      next();
      return;
    }

    res.status(503).json({
      error: "Service temporarily unavailable",
      code: "TENANT_RESOLUTION_FAILED",
    });
  }
};

/**
 * Guard middleware to require publication context on the current request.
 * Use after subdomainMiddleware on routes that need a resolved publication.
 */
export const requirePublicationContext = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const publication = req.tenant?.publication;
  if (!publication) {
    res.status(404).json({ error: "Publication not found", code: "NOT_FOUND" });
    return;
  }
  req.publication = publication;
  next();
};
