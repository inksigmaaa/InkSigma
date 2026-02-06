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

/**
 * Middleware to handle tenant context
 * Reads subdomain from X-Subdomain header set by frontend
 */
export const subdomainMiddleware = async (req, res, next) => {
  try {
    // Read subdomain from header (set by frontend middleware/axios interceptor)
    const subdomain = req.headers["x-subdomain"] || null;
    const normalizedSubdomain = subdomain ? subdomain.toLowerCase() : null;

    const isDashboard = normalizedSubdomain === DASHBOARD_SUBDOMAIN;
    const isReserved = normalizedSubdomain
      ? RESERVED_SUBDOMAINS.has(normalizedSubdomain)
      : false;

    let publication = null;
    let tenantType = "root";

    if (normalizedSubdomain) {
      tenantType = isDashboard ? "dashboard" : "subdomain";

      // Only resolve publication for non-reserved subdomains
      if (!isDashboard && !isReserved) {
        publication = await resolvePublicationBySubdomain(normalizedSubdomain);
      }
    }

    // Attach tenant info to request
    req.tenant = {
      subdomain: normalizedSubdomain,
      isDashboard,
      isReservedSubdomain: isReserved,
      type: tenantType,
      publication,
    };

    return next();
  } catch (error) {
    console.error("[SubdomainMiddleware] Error:", error);
    return next();
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
