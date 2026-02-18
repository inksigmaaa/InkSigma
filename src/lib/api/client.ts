import axios from 'axios';

const getApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:5000';
};

const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'inksigma.com';

  if (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain) {
    const parts = hostname.split('.');
    if (parts[0] && !['dashboard', 'www', 'api'].includes(parts[0])) {
      return parts[0];
    }
  }

  if (hostname.endsWith(`.${mainDomain}`) && hostname !== mainDomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '').split('.')[0];
    if (subdomain !== 'www') return subdomain;
  }
  return null;
};

export const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const subdomain = getSubdomain();
  if (subdomain) config.headers['X-Subdomain'] = subdomain;
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
