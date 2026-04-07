import { useEffect, useState } from 'react';
import { hasActiveCustomDomain } from "@/utils/publicationDomain";
import { getApiBase } from "@/utils/apiBase";
import { fetchJsonWithRetry } from "@/lib/api/client";

const API_URL = getApiBase();

export function usePublicationMeta(identifier = null) {
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const subdomain =
    typeof identifier === 'string' ? identifier : identifier?.subdomain;
  const customDomain =
    typeof identifier === 'object'
      ? identifier?.customDomain ||
        (hasActiveCustomDomain(identifier) ? identifier?.customDomain : null)
      : null;

  useEffect(() => {
    const controller = new AbortController();

    const fetchPublication = async () => {
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
        const data = await fetchJsonWithRetry(
          endpoint,
          {
            credentials: 'include',
            signal: controller.signal,
          },
          {
            attempts: 4,
            delayMs: 300,
          },
        );

        console.log('[usePublicationMeta] Publication data received:', data);
        setPublication(data);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        setPublication(null);
        console.error('[usePublicationMeta] Error fetching publication:', error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPublication();

    return () => {
      controller.abort();
    };
  }, [subdomain, customDomain]);

  return { publication, loading };
}
