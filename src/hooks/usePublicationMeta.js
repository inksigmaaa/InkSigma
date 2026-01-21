import { useEffect, useState } from 'react';

export function usePublicationMeta(subdomain = null) {
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Frontend only - no API call
    setLoading(false);
  }, [subdomain]);

  return { publication, loading };
}
