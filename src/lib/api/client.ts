import axios from 'axios';
import { parseHost } from '@/utils/hostParser';
import { buildLoginRedirectPath, isAuthFlowPath } from '@/utils/auth';

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
  timeout: 30_000, // 30s — prevent requests from hanging indefinitely
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
        if (
          typeof window !== 'undefined' &&
          !isAuthFlowPath(window.location.pathname)
        ) {
          window.location.href = buildLoginRedirectPath();
        }
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

const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      resolve();
    }, ms);

    const handleAbort = () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      reject(createAbortError());
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });

const readErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || response.statusText;
  } catch {
    try {
      const text = await response.text();
      return text || response.statusText;
    } catch {
      return response.statusText;
    }
  }
};

export async function fetchJsonWithRetry(
  url: string,
  fetchOptions: RequestInit = {},
  {
    attempts = 4,
    delayMs = 300,
    retryOnStatuses = [404, 408, 425, 429, 500, 502, 503, 504],
  }: {
    attempts?: number;
    delayMs?: number;
    retryOnStatuses?: number[];
  } = {},
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (fetchOptions.signal?.aborted) {
      throw createAbortError();
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (response.ok) {
        return await response.json();
      }

      const message = await readErrorMessage(response);
      const error = new Error(message || 'Request failed') as Error & { status?: number };
      error.status = response.status;
      lastError = error;

      if (attempt === attempts || !retryOnStatuses.includes(response.status)) {
        throw error;
      }
    } catch (error) {
      if ((error as Error | undefined)?.name === 'AbortError') {
        throw error;
      }

      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
    }

    await delay(delayMs * attempt, fetchOptions.signal);
  }

  throw lastError || new Error('Request failed');
}

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
