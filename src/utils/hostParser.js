/**
 * Host parsing utilities for subdomain detection
 * Ported from backend to frontend for client-side parsing
 */

/**
 * Normalize a host value (remove port, lowercase, handle IPv6)
 * @param {string} rawHost - The raw host string
 * @returns {string} - Normalized hostname
 */
export const normalizeHost = (rawHost) => {
    if (!rawHost) return "";
    const lower = String(rawHost).trim().toLowerCase();
    // Strip IPv6 brackets and port if present
    const host = lower.startsWith("[") ? lower.slice(1) : lower;
    const withoutPort = host.split(":")[0];
    return withoutPort.endsWith("]") ? withoutPort.slice(0, -1) : withoutPort;
};

/**
 * Get base domains from environment or defaults
 * @returns {string[]} - Array of base domains
 */
export const getBaseDomains = () => {
    // In browser context, use NEXT_PUBLIC_ prefixed env vars
    const envValue =
        process.env.NEXT_PUBLIC_BASE_DOMAINS ||
        process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
        "localhost,inksigma.local";

    return envValue
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
};

/**
 * Get the main production domain
 * @returns {string} - Main domain
 */
export const getMainDomain = () => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
    const configuredMain = process.env.NEXT_PUBLIC_MAIN_DOMAIN;

    if (configuredMain) return configuredMain;

    if (
        rootDomain === "localhost" ||
        rootDomain.endsWith(".local") ||
        rootDomain.endsWith(".localhost")
    ) {
        return rootDomain;
    }

    return "inksigma.com";
};

/**
 * Parse a host string to extract subdomain information
 * @param {string} rawHost - The raw host string (e.g., "subdomain.localhost:3000")
 * @returns {{
 *   hostname: string,
 *   baseDomain: string | null,
 *   subdomain: string | null,
 *   isRootDomain: boolean,
 *   isCustomDomain: boolean,
 *   isDashboard: boolean
 * }}
 */
export const parseHost = (rawHost) => {
    const hostname = normalizeHost(rawHost);
    const baseDomains = getBaseDomains();
    const mainDomain = getMainDomain();

    // Check if this is a dashboard subdomain
    const isDashboard =
        hostname === `dashboard.${baseDomains[0]}` ||
        hostname === "dashboard.localhost" ||
        hostname === `dashboard.${mainDomain}`;

    // Find matching base domain
    let matchedBase = null;
    for (const baseDomain of [...baseDomains, mainDomain]) {
        if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
            matchedBase = baseDomain;
            break;
        }
    }

    // No matching base domain - could be a custom domain
    if (!matchedBase) {
        return {
            hostname,
            baseDomain: null,
            subdomain: null,
            isRootDomain: false,
            isCustomDomain: Boolean(hostname),
            isDashboard: false,
        };
    }

    // Exact match with base domain - root domain
    if (hostname === matchedBase) {
        return {
            hostname,
            baseDomain: matchedBase,
            subdomain: null,
            isRootDomain: true,
            isCustomDomain: false,
            isDashboard: false,
        };
    }

    // Extract subdomain
    const suffix = `.${matchedBase}`;
    const subdomain = hostname.slice(0, -suffix.length);

    return {
        hostname,
        baseDomain: matchedBase,
        subdomain,
        isRootDomain: false,
        isCustomDomain: false,
        isDashboard: subdomain === "dashboard",
    };
};

/**
 * Build a publication URL from subdomain
 * @param {string} subdomain - The publication subdomain
 * @returns {string} - Full URL to the publication
 */
export const buildPublicationUrl = (subdomain) => {
    if (!subdomain) return "";

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
    const mainDomain = getMainDomain();

    const shouldUseRootDomain =
        process.env.NODE_ENV !== "production" ||
        rootDomain === "localhost" ||
        rootDomain.endsWith(".local") ||
        rootDomain.endsWith(".localhost");

    if (shouldUseRootDomain) {
        return `http://${subdomain}.${rootDomain}:3000`;
    }

    return `https://${subdomain}.${mainDomain}`;
};

/**
 * Extract subdomain from current window location
 * @returns {string | null} - Subdomain or null
 */
export const getSubdomainFromLocation = () => {
    if (typeof window === "undefined") return null;

    const parsed = parseHost(window.location.host);
    return parsed.subdomain;
};
