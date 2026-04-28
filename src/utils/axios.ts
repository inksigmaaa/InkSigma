import axios from 'axios';
import { parseHost } from './hostParser';
import { buildLoginRedirectPath, isAuthFlowPath } from './auth';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

const getTenantHeadersFromBrowser = (): Record<string, string> => {
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
    const tenantHeaders = getTenantHeadersFromBrowser();
    Object.entries(tenantHeaders || {}).forEach(([key, value]) => {
      config.headers[key] = value;
    });
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
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !isAuthFlowPath(window.location.pathname)
    ) {
      window.location.href = buildLoginRedirectPath();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
