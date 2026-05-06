import logger from "../utils/logger.js";

/**
 * Subdomain Middleware (Simplified)
 * Reads subdomain from X-Subdomain header (set by frontend)
 * instead of parsing host header
 */

import {
  resolvePublicationBySubdomain,
  resolvePublicationByCustomDomain,
} from "../services/publicationResolver.js";

const DASHBOARD_SUBDOMAIN = process.env.DASHBOARD_SUBDOMAIN || "dashboard";
const getLocalLikeBaseDomain = () =>
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
  getLocalLikeBaseDomain() || process.env.MAIN_DOMAIN || "inksigma.com"
).toLowerCase();
const BASE_DOMAINS = (
  process.env.BASE_DOMAINS ||
  process.env.BASE_DOMAIN ||
  "localhost,inksigma.local"
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

// Reserved subdomains that don't map to publications
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

const normalizeHost = (rawHost) => {
  if (!rawHost) return "";

  const trimmed = String(rawHost).trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0];

  if (withoutPath.startsWith("[")) {
    return withoutPath.slice(1).split("]")[0].toLowerCase();
  }

  return withoutPath.split(":")[0];
};

const extractHostFromUrl = (rawValue) => {
  if (!rawValue) return "";

  try {
    return normalizeHost(new URL(String(rawValue)).host);
  } catch {
    return normalizeHost(rawValue);
  }
};

const resolveTenantFromHost = async (host) => {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return {
      host: "",
      subdomain: null,
      customDomain: null,
      publication: null,
      type: "root",
      isDashboard: false,
      isReservedSubdomain: false,
      isCustomDomain: false,
    };
  }

  const candidateBaseDomains = [...BASE_DOMAINS, MAIN_DOMAIN]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const baseDomain of candidateBaseDomains) {
    if (normalizedHost === baseDomain) {
      return {
        host: normalizedHost,
        subdomain: null,
        customDomain: null,
        publication: null,
        type: "root",
        isDashboard: false,
        isReservedSubdomain: false,
        isCustomDomain: false,
      };
    }

    const suffix = `.${baseDomain}`;
    if (!normalizedHost.endsWith(suffix)) {
      continue;
    }

    const subdomain = normalizedHost.slice(0, -suffix.length);
    const isDashboard = subdomain === DASHBOARD_SUBDOMAIN;
    const isReserved = RESERVED_SUBDOMAINS.has(subdomain);

    return {
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
  }

  const publication = await resolvePublicationByCustomDomain(normalizedHost);

  return {
    host: normalizedHost,
    subdomain: publication?.subdomain || null,
    customDomain: normalizedHost,
    publication,
    type: publication ? "custom-domain" : "unknown",
    isDashboard: false,
    isReservedSubdomain: false,
    isCustomDomain: true,
  };
};

// Routes that never need tenant context. Skipping the DB lookup here removes
// per-request publication-resolver work from the auth and health hot paths
// (better-auth's client polls /api/auth/get-session frequently).
const TENANT_BYPASS_PREFIXES = ["/api/auth", "/health", "/ready"];

/**
 * Middleware to handle tenant context
 * Reads subdomain from X-Subdomain header set by frontend
 */
export const subdomainMiddleware = async (req, res, next) => {
  if (
    TENANT_BYPASS_PREFIXES.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    )
  ) {
    return next();
  }

  try {
    const explicitSubdomain = normalizeHost(req.headers["x-subdomain"]);
    const explicitCustomDomain = normalizeHost(req.headers["x-custom-domain"]);

    let tenant;

    if (explicitSubdomain) {
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
    } else if (explicitCustomDomain) {
      tenant = await resolveTenantFromHost(explicitCustomDomain);
    } else {
      const forwardedHost = extractHostFromUrl(req.headers.origin);
      const refererHost = extractHostFromUrl(req.headers.referer);
      const requestHost = normalizeHost(req.headers["x-forwarded-host"] || req.headers.host);
      const detectedHost = forwardedHost || refererHost || requestHost;

      tenant = await resolveTenantFromHost(detectedHost);
    }

    // Attach tenant info to request
    req.tenant = tenant;

    return next();
  } catch (error) {
    logger.error(error, "[SubdomainMiddleware] Error resolving tenant");

    // Allow health, readiness, and auth routes through without tenant context.
    // All other routes fail closed so that downstream authorization isn't bypassed.
    const safePathPrefixes = ["/health", "/ready", "/api/auth"];
    const isSafePath = safePathPrefixes.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    );

    if (isSafePath) {
      return next();
    }

    return res.status(503).json({
      error: "Service temporarily unavailable",
      code: "TENANT_RESOLUTION_FAILED",
    });
  }
};

/**
 * Guard middleware to require publication context
 */
export const requirePublicationContext = (req, res, next) => {
  const publication = req.tenant?.publication;
  if (!publication) {
    return res.status(404).json({ error: "Publication not found" });
  }
  req.publication = publication;
  return next();
};
