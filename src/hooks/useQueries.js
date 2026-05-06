'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useQueryHook = (key, url, options = {}) => {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchApi(url, { signal }),
    ...options,
  });
};

export const useMutationHook = (url, method = 'POST', options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => fetchApi(url, {
      method,
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      if (options.invalidate) {
        queryClient.invalidateQueries(options.invalidate);
      }
    },
    ...options,
  });
};

export const usePublications = (userId, options = {}) => {
  return useQuery({
    queryKey: ['publications', userId],
    queryFn: ({ signal }) => fetchApi(`/api/publications/user/${userId}`, { signal }),
    enabled: !!userId,
    ...options,
  });
};

export const usePublication = (publicationId, options = {}) => {
  return useQuery({
    queryKey: ['publication', publicationId],
    queryFn: ({ signal }) => fetchApi(`/api/publications/${publicationId}`, { signal }),
    enabled: !!publicationId,
    ...options,
  });
};

export const useBlogs = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: ({ signal }) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi(`/api/blogs?${queryString}`, { signal });
    },
    ...options,
  });
};

export const useBlog = (blogId, options = {}) => {
  return useQuery({
    queryKey: ['blog', blogId],
    queryFn: ({ signal }) => fetchApi(`/api/blogs/${blogId}`, { signal }),
    enabled: !!blogId,
    ...options,
  });
};

export const useBlogStats = (blogIds, options = {}) => {
  return useQuery({
    queryKey: ['blogStats', blogIds],
    queryFn: ({ signal }) => {
      const ids = Array.isArray(blogIds) ? blogIds.join(',') : blogIds;
      return fetchApi(`/api/views/stats?blogIds=${ids}`, { signal });
    },
    enabled: !!blogIds && blogIds.length > 0,
    ...options,
  });
};

export const useComments = (blogId, options = {}) => {
  return useQuery({
    queryKey: ['comments', blogId],
    queryFn: ({ signal }) => fetchApi(`/api/comments/blog/${blogId}`, { signal }),
    enabled: !!blogId,
    ...options,
  });
};

export const useCommentCounts = (blogIds, options = {}) => {
  return useQuery({
    queryKey: ['commentCounts', blogIds],
    queryFn: ({ signal }) => {
      const ids = Array.isArray(blogIds) ? blogIds.join(',') : blogIds;
      return fetchApi(`/api/comments/counts?blogIds=${ids}`, { signal });
    },
    enabled: !!blogIds && blogIds.length > 0,
    ...options,
  });
};

export const useNotifications = (userId, options = {}) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: ({ signal }) => fetchApi(`/api/notifications/${userId}`, { signal }),
    enabled: !!userId,
    ...options,
  });
};

export const useMembers = (publicationId, options = {}) => {
  return useQuery({
    queryKey: ['members', publicationId],
    queryFn: ({ signal }) => fetchApi(`/api/members/${publicationId}/members`, { signal }),
    enabled: !!publicationId,
    ...options,
  });
};

export const useProfile = (options = {}) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => fetchApi('/api/profile', { signal }),
    ...options,
  });
};

export const useCreateBlog = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => fetchApi('/api/blogs', 'POST', { body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      if (options.invalidate) {
        queryClient.invalidateQueries(options.invalidate);
      }
    },
  });
};

export const useUpdateBlog = (blogId, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => fetchApi(`/api/blogs/${blogId}`, 'PUT', { body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', blogId] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
};

export const useDeleteBlog = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (blogId) => fetchApi(`/api/blogs/${blogId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
};

export const usePublishBlog = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (blogId) => fetchApi(`/api/blogs/${blogId}/publish`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
};

export const useCreatePublication = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => fetchApi('/api/publications', 'POST', { body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
    },
  });
};

export const useUpdatePublication = (publicationId, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => fetchApi(`/api/publications/${publicationId}`, 'PUT', { body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication', publicationId] });
    },
  });
};

export const useInviteMember = (publicationId, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => fetchApi(`/api/members/${publicationId}/invite`, 'POST', { body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', publicationId] });
    },
  });
};

export const useRemoveMember = (publicationId, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memberId) => fetchApi(`/api/members/${publicationId}/members/${memberId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', publicationId] });
    },
  });
};

export const useMarkNotificationRead = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, notificationId }) => 
      fetchApi(`/api/notifications/${notificationId}/read`, 'POST', { 
        body: JSON.stringify({ userId }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export default {
  useQueryHook,
  useMutationHook,
  usePublications,
  usePublication,
  useBlogs,
  useBlog,
  useBlogStats,
  useComments,
  useCommentCounts,
  useNotifications,
  useMembers,
  useProfile,
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  usePublishBlog,
  useCreatePublication,
  useUpdatePublication,
  useInviteMember,
  useRemoveMember,
  useMarkNotificationRead,
};
