'use client';

const getPublicationUrl = (publication) => {
  if (!publication?.subdomain) return '';

  if (typeof window !== 'undefined') {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDevelopment || isLocalhost) {
      return `http://${publication.subdomain}.localhost:3000`;
    }
  }

  return `https://${publication.subdomain}.inksigma.com`;
};

export function PublicationUrl({ publication }) {
  return getPublicationUrl(publication);
}

export function usePublicationUrl(publication) {
  return getPublicationUrl(publication);
}
