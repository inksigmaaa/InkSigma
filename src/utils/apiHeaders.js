/**
 * API Headers helper
 * Provides headers with subdomain context for API calls
 */

import { getSubdomainFromLocation } from './hostParser';

/**
 * Get the current subdomain from browser context
 * @returns {string | null} - Current subdomain or null
 */
export const getCurrentSubdomain = () => {
    if (typeof window === 'undefined') return null;
    return getSubdomainFromLocation();
};

/**
 * Build headers object with subdomain context
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} - Headers object with X-Subdomain if available
 */
export const buildApiHeaders = (additionalHeaders = {}) => {
    const headers = {
        ...additionalHeaders,
    };

    const subdomain = getCurrentSubdomain();
    if (subdomain) {
        headers['X-Subdomain'] = subdomain;
    }

    return headers;
};

/**
 * Build fetch options with subdomain header
 * @param {Object} options - Fetch options
 * @returns {Object} - Fetch options with subdomain header
 */
export const buildFetchOptions = (options = {}) => {
    const subdomain = getCurrentSubdomain();

    const headers = {
        ...(options.headers || {}),
    };

    if (subdomain) {
        headers['X-Subdomain'] = subdomain;
    }

    return {
        ...options,
        credentials: 'include',
        headers,
    };
};

/**
 * Fetch wrapper that automatically includes subdomain header
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const fetchWithSubdomain = (url, options = {}) => {
    return fetch(url, buildFetchOptions(options));
};
