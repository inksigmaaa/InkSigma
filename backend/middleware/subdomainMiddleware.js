import { parseHost } from "../utils/hostParser.js";
import { isReservedSubdomain } from "../utils/subdomainRules.js";
import {
  resolvePublicationBySubdomain,
  resolvePublicationByCustomDomain,
} from "../services/publicationResolver.js";

const DASHBOARD_SUBDOMAIN =
  process.env.DASHBOARD_SUBDOMAIN || "dashboard";

export const subdomainMiddleware = async (req, res, next) => {
  try {
    const { hostname, subdomain, isCustomDomain, baseDomain } = parseHost(
      req.headers.host,
    );

    const normalizedSubdomain = subdomain ? subdomain.toLowerCase() : null;
    const isDashboard = normalizedSubdomain === DASHBOARD_SUBDOMAIN;
    const isReserved = normalizedSubdomain
      ? isReservedSubdomain(normalizedSubdomain)
      : false;

    let publication = null;
    let tenantType = "root";

    if (isCustomDomain) {
      tenantType = "custom-domain";
      publication = await resolvePublicationByCustomDomain(hostname);
    } else if (normalizedSubdomain) {
      tenantType = isDashboard ? "dashboard" : "subdomain";
      if (!isDashboard && !isReserved) {
        publication = await resolvePublicationBySubdomain(normalizedSubdomain);
      }
    }

    req.tenant = {
      host: hostname,
      baseDomain,
      subdomain: normalizedSubdomain,
      isCustomDomain,
      isDashboard,
      isReservedSubdomain: isReserved,
      type: tenantType,
      publication,
    };

    return next();
  } catch (error) {
    console.error("[SubdomainMiddleware] Failed to parse host:", error);
    return next();
  }
};

export const requirePublicationContext = (req, res, next) => {
  const publication = req.tenant?.publication;
  if (!publication) {
    return res.status(404).json({ error: "Publication not found" });
  }
  req.publication = publication;
  return next();
};
