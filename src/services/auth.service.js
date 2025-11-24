/**
 * Authentication service
 */
import axios from '@/utils/axios';

export const authService = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @returns {Promise} - User data and token
   */
  login: async (credentials) => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - User data and token
   */
  register: async (userData) => {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    const response = await axios.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current session
   * @returns {Promise} - Session and user data
   */
  getSession: async () => {
    const response = await axios.get('/auth/session');
    return response.data;
  },

  /**
   * Refresh auth token
   * @returns {Promise} - New token
   */
  refreshToken: async () => {
    const response = await axios.post('/auth/refresh');
    return response.data;
  },

  /**
   * Delete all sessions (logout from all devices)
   * @returns {Promise}
   */
  deleteAllSessions: async () => {
    const response = await axios.delete('/auth/sessions');
    return response.data;
  }
}
