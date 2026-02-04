'use client';

import { useState, useEffect } from 'react';

export function PublicationUrl({ publication }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!publication?.subdomain) return;

    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDevelopment || isLocalhost) {
      // In development, use subdomain.localhost:3000 format
      setUrl(`http://${publication.subdomain}.localhost:3000`);
    } else {
      // In production, use subdomain
      setUrl(`https://${publication.subdomain}.inksigma.com`);
    }
  }, [publication]);

  return url;
}

export function usePublicationUrl(publication) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!publication?.subdomain) return;

    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDevelopment || isLocalhost) {
      setUrl(`http://${publication.subdomain}.localhost:3000`);
    } else {
      setUrl(`https://${publication.subdomain}.inksigma.com`);
    }
  }, [publication]);

  return url;
}
