const PUBLIC_SITE_AUTH_TOKEN_KEY = 'inksigma.publicSiteAuthToken';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

export const getStoredPublicSiteAuthToken = () => {
  try {
    return getStorage()?.getItem(PUBLIC_SITE_AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const storePublicSiteAuthToken = (token) => {
  if (!token) return;

  try {
    getStorage()?.setItem(PUBLIC_SITE_AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage failures and continue without a persisted token.
  }
};

export const clearStoredPublicSiteAuthToken = () => {
  try {
    getStorage()?.removeItem(PUBLIC_SITE_AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const readAuthTokenFromUrl = () => {
  if (typeof window === 'undefined') return '';

  const url = new URL(window.location.href);
  const searchToken = url.searchParams.get('publicAuthToken') || '';
  if (searchToken) {
    return searchToken;
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  return hashParams.get('publicAuthToken') || '';
};

const removeAuthTokenFromUrl = () => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('publicAuthToken');

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  hashParams.delete('publicAuthToken');
  url.hash = hashParams.toString();

  window.history.replaceState({}, '', url.toString());
};

export const consumePublicSiteAuthTokenFromUrl = () => {
  const token = readAuthTokenFromUrl();
  if (!token) return '';

  storePublicSiteAuthToken(token);
  removeAuthTokenFromUrl();
  return token;
};
