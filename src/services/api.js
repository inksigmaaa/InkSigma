/**
 * Base API configuration and utilities
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * HTTP methods enum
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
}

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

/**
 * Base fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Response data
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, config)
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      throw new APIError(
        data.message || 'An error occurred',
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network or other errors
    throw new APIError(
      error.message || 'Network error occurred',
      0,
      null
    )
  }
}

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
  return apiFetch(endpoint, {
    method: HTTP_METHODS.GET,
    ...options
  })
}

/**
 * POST request
 */
export const post = (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    method: HTTP_METHODS.POST,
    body: JSON.stringify(data),
    ...options
  })
}

/**
 * PUT request
 */
export const put = (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    method: HTTP_METHODS.PUT,
    body: JSON.stringify(data),
    ...options
  })
}

/**
 * PATCH request
 */
export const patch = (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    method: HTTP_METHODS.PATCH,
    body: JSON.stringify(data),
    ...options
  })
}

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
  return apiFetch(endpoint, {
    method: HTTP_METHODS.DELETE,
    ...options
  })
}
