import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function usePublicationMeta(subdomain = null) {
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublication = async () => {
      console.log('[usePublicationMeta] Fetching publication for subdomain:', subdomain);
      if (!subdomain) {
        console.log('[usePublicationMeta] No subdomain provided');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        console.log('[usePublicationMeta] Making API call to:', `${API_URL}/api/publications/by-subdomain/${subdomain}`);
        const response = await fetch(`${API_URL}/api/publications/by-subdomain/${subdomain}`, {
          credentials: 'include'
        });

        console.log('[usePublicationMeta] API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('[usePublicationMeta] Publication data received:', data);
          setPublication(data);
        } else {
          const errorText = await response.text();
          console.error('[usePublicationMeta] Failed to fetch publication by subdomain:', response.status, errorText);
        }
      } catch (error) {
        console.error('[usePublicationMeta] Error fetching publication by subdomain:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublication();
  }, [subdomain]);

  return { publication, loading };
}
