/**
 * Authentication service
 */
import { post, get } from './api'

export const authService = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @returns {Promise} - User data and token
   */
  login: async (credentials) => {
    return post('/auth/login', credentials)
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - User data and token
   */
  register: async (userData) => {
    return post('/auth/register', userData)
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    return post('/auth/logout')
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise}
   */
  forgotPassword: async (email) => {
    return post('/auth/forgot-password', { email })
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise}
   */
  resetPassword: async (token, newPassword) => {
    return post('/auth/reset-password', { token, newPassword })
  },

  /**
   * Verify magic link token
   * @param {string} token - Magic link token
   * @returns {Promise}
   */
  verifyMagicLink: async (token) => {
    return post('/auth/verify-magic-link', { token })
  },

  /**
   * Get current user
   * @returns {Promise} - User data
   */
  getCurrentUser: async () => {
    return get('/auth/me')
  },

  /**
   * Refresh auth token
   * @returns {Promise} - New token
   */
  refreshToken: async () => {
    return post('/auth/refresh')
  }
}
