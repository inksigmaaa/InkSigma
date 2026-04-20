import { getApiBase } from '@/utils/apiBase';
import {
  clearStoredPublicSiteAuthToken,
  getStoredPublicSiteAuthToken,
} from '@/utils/publicSiteSession';

const normalizeApiPath = (path) =>
  path.startsWith('/') ? path : `/${path}`;

export const getPublicSiteApiBase = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return `${getApiBase()}/api`;
};

export const buildPublicSiteApiUrl = (path) =>
  `${getPublicSiteApiBase()}${normalizeApiPath(path)}`;

export const buildPublicSiteAuthHeaders = (headers = undefined) => {
  const nextHeaders = new Headers(headers || {});
  const token = getStoredPublicSiteAuthToken();

  if (token && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', `Bearer ${token}`);
  }

  return nextHeaders;
};

export const buildTenantHeaders = ({
  subdomain = null,
  customDomain = null,
} = {}) => {
  const headers = new Headers();

  if (customDomain) {
    headers.set('X-Custom-Domain', customDomain);
  } else if (subdomain) {
    headers.set('X-Subdomain', subdomain);
  }

  return headers;
};

export const withPublicSiteAuth = (requestInit = {}) => {
  const { headers, ...rest } = requestInit;

  return {
    ...rest,
    headers: buildPublicSiteAuthHeaders(headers),
  };
};

export const clearInvalidPublicSiteAuth = (response) => {
  if (response?.status === 401 || response?.status === 403) {
    clearStoredPublicSiteAuthToken();
  }
};
