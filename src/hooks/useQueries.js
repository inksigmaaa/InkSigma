'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiBase } from '@/utils/apiBase';

const API_URL = getApiBase();

const fetchApi = async (url, options = {}) => {
  const { signal, ...rest } = options;
  const response = await fetch(`${API_URL}${url}`, {
    ...rest,
    credentials: rest.credentials || 'include',
    cache: rest.cache || 'no-store',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// The data layer is consolidated onto the Zustand store + services
// (articleStore, PublicationContext). The profile read is the one remaining
// React Query hook; the rest of the former React Query layer was unused.
export const useProfile = (options = {}) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => fetchApi('/api/profile', { signal }),
    ...options,
  });
};
