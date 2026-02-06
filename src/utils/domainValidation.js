/**
 * Domain and publication validation utilities
 * Comprehensive client-side validation for domains and publication settings
 */

import { validateSubdomain, normalizeSubdomain } from './subdomainRules';

/**
 * Validate a custom domain
 * @param {string} domain - The domain to validate
 * @returns {{ valid: boolean, error?: string }} - Validation result
 */
export const validateCustomDomain = (domain) => {
    if (!domain) {
        return { valid: true }; // Custom domain is optional
    }

    const trimmed = String(domain).trim().toLowerCase();

    // Check for protocol prefix
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return { valid: false, error: "Custom domain must not include protocol (http:// or https://)" };
    }

    // Check for path or query
    if (trimmed.includes("/") || trimmed.includes("?") || trimmed.includes("#")) {
        return { valid: false, error: "Custom domain must not include path or query parameters" };
    }

    // Basic FQDN validation
    // Must have at least one dot, valid characters, valid TLD
    const fqdnRegex = /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63})*\.[a-zA-Z]{2,63}$/;

    if (!fqdnRegex.test(trimmed)) {
        return { valid: false, error: "Custom domain must be a valid domain name (e.g., example.com)" };
    }

    // Check for reserved/blocked TLDs or patterns
    const blockedPatterns = [
        /\.local$/, // .local is for mDNS
        /\.localhost$/, // localhost TLD
        /\.test$/, // test TLD
        /\.invalid$/, // invalid TLD
        /\.example$/, // example TLD
    ];

    for (const pattern of blockedPatterns) {
        if (pattern.test(trimmed)) {
            return { valid: false, error: "This domain extension is not allowed" };
        }
    }

    return { valid: true };
};

/**
 * Validate publication name
 * @param {string} name - The publication name
 * @returns {{ valid: boolean, error?: string }} - Validation result
 */
export const validatePublicationName = (name) => {
    if (!name) {
        return { valid: false, error: "Publication name is required" };
    }

    const trimmed = String(name).trim();

    if (trimmed.length < 2) {
        return { valid: false, error: "Publication name must be at least 2 characters" };
    }

    if (trimmed.length > 50) {
        return { valid: false, error: "Publication name must not exceed 50 characters" };
    }

    // Check for only whitespace
    if (!/\S/.test(trimmed)) {
        return { valid: false, error: "Publication name cannot be only whitespace" };
    }

    return { valid: true };
};

/**
 * Validate publication description
 * @param {string} description - The description
 * @returns {{ valid: boolean, error?: string }} - Validation result
 */
export const validatePublicationDescription = (description) => {
    if (!description) {
        return { valid: true }; // Description is optional
    }

    const trimmed = String(description).trim();

    if (trimmed.length > 100) {
        return { valid: false, error: "Description must not exceed 100 characters" };
    }

    return { valid: true };
};

/**
 * Validate all publication fields
 * @param {{ name: string, subdomain: string, description?: string, customDomain?: string }} data
 * @returns {{ valid: boolean, errors: { [key: string]: string } }} - Validation result
 */
export const validatePublication = (data) => {
    const errors = {};

    // Validate name
    const nameResult = validatePublicationName(data.name);
    if (!nameResult.valid) {
        errors.name = nameResult.error;
    }

    // Validate subdomain
    const subdomainResult = validateSubdomain(data.subdomain);
    if (!subdomainResult.valid) {
        errors.subdomain = subdomainResult.error;
    }

    // Validate description (optional)
    if (data.description !== undefined) {
        const descResult = validatePublicationDescription(data.description);
        if (!descResult.valid) {
            errors.description = descResult.error;
        }
    }

    // Validate custom domain (optional)
    if (data.customDomain !== undefined) {
        const domainResult = validateCustomDomain(data.customDomain);
        if (!domainResult.valid) {
            errors.customDomain = domainResult.error;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Normalize custom domain (lowercase, trim)
 * @param {string} domain - The domain to normalize
 * @returns {string | null} - Normalized domain or null if empty
 */
export const normalizeCustomDomain = (domain) => {
    if (!domain) return null;
    const trimmed = String(domain).trim().toLowerCase();
    return trimmed || null;
};

// Re-export subdomain utilities for convenience
export { validateSubdomain, normalizeSubdomain };
