'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiBase } from '@/utils/apiBase';

const API_URL = getApiBase();

const fetchApi = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
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
    queryFn: () => fetchApi(url),
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
    queryFn: () => fetchApi(`/api/publications/user/${userId}`),
    enabled: !!userId,
    ...options,
  });
};

export const usePublication = (publicationId, options = {}) => {
  return useQuery({
    queryKey: ['publication', publicationId],
    queryFn: () => fetchApi(`/api/publications/${publicationId}`),
    enabled: !!publicationId,
    ...options,
  });
};

export const useBlogs = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: () => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi(`/api/blogs?${queryString}`);
    },
    ...options,
  });
};

export const useBlog = (blogId, options = {}) => {
  return useQuery({
    queryKey: ['blog', blogId],
    queryFn: () => fetchApi(`/api/blogs/${blogId}`),
    enabled: !!blogId,
    ...options,
  });
};

export const useBlogStats = (blogIds, options = {}) => {
  return useQuery({
    queryKey: ['blogStats', blogIds],
    queryFn: () => {
      const ids = Array.isArray(blogIds) ? blogIds.join(',') : blogIds;
      return fetchApi(`/api/views/stats?blogIds=${ids}`);
    },
    enabled: !!blogIds && blogIds.length > 0,
    ...options,
  });
};

export const useComments = (blogId, options = {}) => {
  return useQuery({
    queryKey: ['comments', blogId],
    queryFn: () => fetchApi(`/api/comments/blog/${blogId}`),
    enabled: !!blogId,
    ...options,
  });
};

export const useCommentCounts = (blogIds, options = {}) => {
  return useQuery({
    queryKey: ['commentCounts', blogIds],
    queryFn: () => {
      const ids = Array.isArray(blogIds) ? blogIds.join(',') : blogIds;
      return fetchApi(`/api/comments/counts?blogIds=${ids}`);
    },
    enabled: !!blogIds && blogIds.length > 0,
    ...options,
  });
};

export const useNotifications = (userId, options = {}) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchApi(`/api/notifications/${userId}`),
    enabled: !!userId,
    ...options,
  });
};

export const useMembers = (publicationId, options = {}) => {
  return useQuery({
    queryKey: ['members', publicationId],
    queryFn: () => fetchApi(`/api/members/${publicationId}/members`),
    enabled: !!publicationId,
    ...options,
  });
};

export const useProfile = (options = {}) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchApi('/api/profile'),
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
