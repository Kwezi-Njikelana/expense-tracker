import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';
import { onAuthMessage } from './auth-channel';
import { applyLogout, authKeys, clearUserData } from '@/hooks/use-auth';

// If any request finds the session has expired, mark the user as logged out
// so the route guard sends them to the login page.
function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(authKeys.me, null);
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
    },
  },
});

// React to logins/logouts made in other tabs.
onAuthMessage((message) => {
  if (message.type === 'logout') {
    applyLogout(queryClient);
  } else {
    // Possibly a different user: drop the old data and refetch who we are.
    clearUserData(queryClient);
    void queryClient.invalidateQueries({ queryKey: authKeys.me });
  }
});
