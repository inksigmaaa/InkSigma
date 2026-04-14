import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from '../client';

const PUBLICATION_KEYS = {
  all: ['publications'],
  lists: () => [...PUBLICATION_KEYS.all, 'list'],
  detail: (id: string) => [...PUBLICATION_KEYS.all, 'detail', id],
  user: (userId: string) => [...PUBLICATION_KEYS.all, 'user', userId],
  userPublications: () => [...PUBLICATION_KEYS.all, 'user-publications'],
};

export const useUserPublication = (userId: string) => {
  return useQuery({
    queryKey: PUBLICATION_KEYS.user(userId),
    queryFn: async () => {
      const res = await api.get(`/publications/user/${userId}`);
      return res.data;
    },
    enabled: !!userId,
  });
};

export const usePublicationDetails = (publicationId: string) => {
  return useQuery({
    queryKey: PUBLICATION_KEYS.detail(publicationId),
    queryFn: async () => {
      const res = await api.get(`/publications/${publicationId}/details`);
      return res.data;
    },
    enabled: !!publicationId,
  });
};

export const useUserPublications = () => {
  return useQuery({
    queryKey: PUBLICATION_KEYS.userPublications(),
    queryFn: async () => {
      const res = await api.get('/publication-members/my-publications');
      return res.data;
    },
  });
};

export const useCreatePublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/publications', data);
      return res.data;
    },
    onSuccess: () => {
      // Only invalidate list-level queries — no need to nuke detail caches
      queryClient.invalidateQueries({ queryKey: PUBLICATION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PUBLICATION_KEYS.userPublications() });
    },
  });
};

export const useUpdatePublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/publications/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PUBLICATION_KEYS.detail(id) });
    },
  });
};

export const useUploadPublicationLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post(`/publications/${id}/logo`, formData);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PUBLICATION_KEYS.detail(id) });
    },
  });
};

export const useUploadPublicationFavicon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('favicon', file);
      const res = await api.post(`/publications/${id}/favicon`, formData);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PUBLICATION_KEYS.detail(id) });
    },
  });
};

export const useRemovePublicationImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const res = await api.delete(`/publications/${id}/image/${type}`);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PUBLICATION_KEYS.detail(id) });
    },
  });
};
