/**
 * API Headers helper
 * Provides headers with subdomain context for API calls
 */

import { parseHost } from './hostParser';

/**
 * Get the current tenant headers from browser context
 * @returns {Object} - Tenant headers
 */
export const getCurrentTenantHeaders = () => {
    if (typeof window === 'undefined') return {};

    const parsed = parseHost(window.location.host);
    if (parsed.isDashboard || parsed.isRootDomain) {
        return {};
    }

    if (parsed.isCustomDomain && parsed.hostname) {
        return { 'X-Custom-Domain': parsed.hostname };
    }

    if (parsed.subdomain && !['dashboard', 'www', 'api'].includes(parsed.subdomain)) {
        return { 'X-Subdomain': parsed.subdomain };
    }

    return {};
};

/**
 * Build headers object with tenant context
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} - Headers object with tenant headers if available
 */
export const buildApiHeaders = (additionalHeaders = {}) => {
    const headers = {
        ...additionalHeaders,
    };

    return {
        ...headers,
        ...getCurrentTenantHeaders(),
    };
};

/**
 * Build fetch options with tenant headers
 * @param {Object} options - Fetch options
 * @returns {Object} - Fetch options with tenant headers
 */
export const buildFetchOptions = (options = {}) => {
    const headers = {
        ...(options.headers || {}),
        ...getCurrentTenantHeaders(),
    };

    return {
        ...options,
        credentials: 'include',
        headers,
    };
};

/**
 * Fetch wrapper that automatically includes tenant headers
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const fetchWithSubdomain = (url, options = {}) => {
    return fetch(url, buildFetchOptions(options));
};
