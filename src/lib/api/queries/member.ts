import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

const MEMBER_KEYS = {
  all: ['members'],
  lists: (pubId: string) => [...MEMBER_KEYS.all, 'list', pubId],
  invitation: (token: string) => [...MEMBER_KEYS.all, 'invitation', token],
};

export const useMembers = (publicationId: string) => {
  return useQuery({
    queryKey: MEMBER_KEYS.lists(publicationId),
    queryFn: async () => {
      const res = await api.get(`/members/${publicationId}/members`);
      return res.data;
    },
    enabled: !!publicationId,
  });
};

export const useInvitationDetails = (token: string) => {
  return useQuery({
    queryKey: MEMBER_KEYS.invitation(token),
    queryFn: async () => {
      const res = await api.get(`/members/invite/${token}`);
      return res.data;
    },
    enabled: !!token,
  });
};

export const useSendInvitation = (publicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await api.post(`/members/${publicationId}/invite`, { email, role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists(publicationId) });
    },
  });
};

export const useResendInvitation = (publicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await api.post(`/members/${publicationId}/invite/${invitationId}/resend`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists(publicationId) });
    },
  });
};

export const useCancelInvitation = (publicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await api.delete(`/members/${publicationId}/invite/${invitationId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists(publicationId) });
    },
  });
};

export const useRemoveMember = (publicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.delete(`/members/${publicationId}/members/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists(publicationId) });
    },
  });
};

export const useLeavePublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (publicationId: string) => {
      const res = await api.post(`/members/${publicationId}/leave`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all });
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/members/invite/${token}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all });
    },
  });
};

export const useDeclineInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/members/invite/${token}/decline`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all });
    },
  });
};
