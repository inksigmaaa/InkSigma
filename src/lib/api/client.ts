import axios from 'axios';
import { parseHost } from '@/utils/hostParser';

const getApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:5000';
};

const getTenantHeaders = (): Record<string, string> => {
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

export const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  Object.entries(getTenantHeaders()).forEach(([key, value]) => {
    config.headers[key] = value;
  });
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    const e = new Error(message);
    (e as any).status = error.response?.status;
    throw e;
  }
  throw error;
};

export const buildQueryString = (params: Record<string, any> = {}): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) value.forEach(v => searchParams.append(key, v));
      else searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

export default api;
