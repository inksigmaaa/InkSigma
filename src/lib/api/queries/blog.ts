import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from '../client';

const BLOG_KEYS = {
  all: ['blogs'],
  lists: () => [...BLOG_KEYS.all, 'list'],
  list: (filters: Record<string, any>) => [...BLOG_KEYS.lists(), filters],
  details: () => [...BLOG_KEYS.all, 'detail'],
  detail: (id: string) => [...BLOG_KEYS.details(), id],
  publication: (pubId: string) => [...BLOG_KEYS.all, 'publication', pubId],
  review: (pubId: string) => [...BLOG_KEYS.all, 'review', pubId],
};

export const useBlogs = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: BLOG_KEYS.list(filters),
    queryFn: async () => {
      const query = buildQueryString(filters);
      const res = await api.get(`/blogs${query ? `?${query}` : ''}`);
      return res.data;
    },
  });
};

export const useBlog = (id: string) => {
  return useQuery({
    queryKey: BLOG_KEYS.detail(id),
    queryFn: async () => {
      const res = await api.get(`/blogs/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const usePublicationBlogs = (publicationId: string, filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: [...BLOG_KEYS.publication(publicationId), filters],
    queryFn: async () => {
      const query = buildQueryString(filters);
      const res = await api.get(`/blogs/publication/${publicationId}${query ? `?${query}` : ''}`);
      return res.data;
    },
    enabled: !!publicationId,
  });
};

export const useReviewArticles = (publicationId: string) => {
  return useQuery({
    queryKey: BLOG_KEYS.review(publicationId),
    queryFn: async () => {
      const res = await api.get(`/blogs/publication/${publicationId}?status=review`);
      return res.data;
    },
    enabled: !!publicationId,
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/blogs', data);
      return res.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.lists() });
      if (result?.publicationId) {
        queryClient.invalidateQueries({ queryKey: BLOG_KEYS.publication(String(result.publicationId)) });
      }
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/blogs/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.lists() });
    },
  });
};

export const useUpdateBlogStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/blogs/${id}/publish`, { status });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.lists() });
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/blogs/${id}`);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.lists() });
    },
  });
};

export const useUploadBlogImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageFile }: { id: string; imageFile: File }) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await api.post(`/blogs/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
    },
  });
};

export const useAcceptReviewArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, targetStatus = 'unpublished' }: { id: string; targetStatus?: string }) => {
      const res = await api.patch(`/blogs/${id}/review-action`, { action: 'accept', targetStatus });
      return res.data;
    },
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.lists() });
      if (result?.publicationId) {
        queryClient.invalidateQueries({ queryKey: BLOG_KEYS.review(String(result.publicationId)) });
      }
    },
  });
};

export const useRejectReviewArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/blogs/${id}/review-action`, { action: 'reject' });
      return res.data;
    },
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BLOG_KEYS.lists() });
      if (result?.publicationId) {
        queryClient.invalidateQueries({ queryKey: BLOG_KEYS.review(String(result.publicationId)) });
      }
    },
  });
};
