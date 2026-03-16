import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function usePublicationMeta(identifier = null) {
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublication = async () => {
      const subdomain =
        typeof identifier === 'string' ? identifier : identifier?.subdomain;
      const customDomain =
        typeof identifier === 'object' ? identifier?.customDomain : null;

      console.log('[usePublicationMeta] Fetching publication for:', {
        subdomain,
        customDomain,
      });

      if (!subdomain && !customDomain) {
        console.log('[usePublicationMeta] No publication identifier provided');
        setPublication(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const endpoint = customDomain
          ? `${API_URL}/api/publications/by-custom-domain/${encodeURIComponent(customDomain)}`
          : `${API_URL}/api/publications/by-subdomain/${encodeURIComponent(subdomain)}`;

        console.log('[usePublicationMeta] Making API call to:', endpoint);
        const response = await fetch(endpoint, {
          credentials: 'include'
        });

        console.log('[usePublicationMeta] API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('[usePublicationMeta] Publication data received:', data);
          setPublication(data);
        } else {
          setPublication(null);
          const errorText = await response.text();
          console.error('[usePublicationMeta] Failed to fetch publication:', response.status, errorText);
        }
      } catch (error) {
        setPublication(null);
        console.error('[usePublicationMeta] Error fetching publication:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublication();
  }, [identifier]);

  return { publication, loading };
}
