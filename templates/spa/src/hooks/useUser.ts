import { getJson } from '@/lib/fetchJson';
import type { AuthUser } from '@vybekiit/auth';
import { queryKeys } from '@vybekiit/client-state';
import { useQuery } from '@tanstack/react-query';

const ME_ENDPOINT = '/api/auth/me';

const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const result = await getJson<AuthUser>(ME_ENDPOINT);
  return result.ok ? result.value : null;
};

/**
 * Load the current authenticated user for SPA pages.
 *
 * @returns The current user and loading state.
 * @example
 * const { user, loading } = useUser();
 */
export const useUser = (): { user: AuthUser | null; loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
  });
  return { user: data === undefined ? null : data, loading: isLoading };
};
