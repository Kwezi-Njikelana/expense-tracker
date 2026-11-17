import type { LoginInput, RegisterInput, User } from '@expense-tracker/shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';
import { broadcastAuth } from '@/lib/auth-channel';

export const authKeys = { me: ['auth', 'me'] as const };

/** Drops everything cached for the previous user (all non-auth queries). */
export function clearUserData(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
}

/** Marks this tab as logged out; the route guard (subscribed to `me`) redirects to /login. */
export function applyLogout(queryClient: QueryClient) {
  queryClient.setQueryData(authKeys.me, null);
  clearUserData(queryClient);
}

/** The signed-in user, or null when logged out. */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await api.get<User>('/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: Infinity,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<User>('/auth/login', input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
      broadcastAuth({ type: 'login' });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<User>('/auth/register', input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
      broadcastAuth({ type: 'login' });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      applyLogout(queryClient);
      broadcastAuth({ type: 'logout' });
    },
  });
}
