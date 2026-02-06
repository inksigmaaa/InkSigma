import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

/**
 * Get subdomain from current browser location
 */
const getSubdomainFromBrowser = (): string | null => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'inksigma.com';

  // Check for subdomain in local development
  if (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain) {
    const parts = hostname.split('.');
    if (parts.length > 0 && parts[0] !== 'dashboard' && parts[0] !== 'www' && parts[0] !== 'api') {
      return parts[0];
    }
  }

  // Check for subdomain in production
  if (hostname.endsWith(`.${mainDomain}`) && hostname !== mainDomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '').split('.')[0];
    if (subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds subdomain header
axiosInstance.interceptors.request.use(
  (config) => {
    // Add subdomain header if available
    const subdomain = getSubdomainFromBrowser();
    if (subdomain) {
      config.headers['X-Subdomain'] = subdomain;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh session
        await axiosInstance.post('/auth/refresh');
        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
