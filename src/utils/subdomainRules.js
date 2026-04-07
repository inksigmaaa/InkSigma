/**
 * Subdomain validation rules and utilities
 * Ported from backend to frontend for client-side validation
 */

// Reserved subdomains that cannot be used for publications
export const RESERVED_SUBDOMAINS = new Set([
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
    "app",
    "auth",
    "login",
    "signup",
    "register",
    "account",
    "billing",
    "docs",
    "blog",
    "news",
    "store",
    "shop",
    "test",
    "dev",
    "staging",
    "prod",
    "production",
]);

/**
 * Normalize a subdomain value (trim and lowercase)
 * @param {string} value - The subdomain to normalize
 * @returns {string} - Normalized subdomain
 */
export const normalizeSubdomain = (value) => {
    if (!value) return "";
    return String(value).trim().toLowerCase();
};

/**
 * Check if a subdomain is reserved
 * @param {string} value - The subdomain to check
 * @returns {boolean} - True if reserved
 */
export const isReservedSubdomain = (value) => {
    const normalized = normalizeSubdomain(value);
    if (!normalized) return false;
    return RESERVED_SUBDOMAINS.has(normalized);
};

/**
 * Validate subdomain format and rules
 * @param {string} value - The subdomain to validate
 * @returns {{ valid: boolean, error?: string }} - Validation result
 */
export const validateSubdomain = (value) => {
    const normalized = normalizeSubdomain(value);

    // Check if empty
    if (!normalized) {
        return { valid: false, error: "Subdomain is required" };
    }

    // Check minimum length
    if (normalized.length < 3) {
        return { valid: false, error: "Subdomain must be at least 3 characters" };
    }

    // Check maximum length
    if (normalized.length > 63) {
        return { valid: false, error: "Subdomain must not exceed 63 characters" };
    }

    // Check for valid characters (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(normalized)) {
        return { valid: false, error: "Subdomain can only contain letters, numbers, and hyphens" };
    }

    // Check for leading/trailing hyphens and consecutive hyphens
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(normalized)) {
        return { valid: false, error: "Subdomain cannot start or end with hyphens" };
    }

    // Check for consecutive hyphens
    if (/--/.test(normalized)) {
        return { valid: false, error: "Subdomain cannot contain consecutive hyphens" };
    }

    // Check if reserved
    if (isReservedSubdomain(normalized)) {
        return { valid: false, error: "This subdomain is reserved" };
    }

    return { valid: true };
};
