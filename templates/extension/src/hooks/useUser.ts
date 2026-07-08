import { getJson } from '@/lib/fetchJson';
import type { AuthUser } from '@vybekiit/auth';
import { queryKeys } from '@vybekiit/client-state';
import { useQuery } from '@tanstack/react-query';

const ME_ENDPOINT = '/api/auth/me';

/**
 * Load the current authenticated user from the backend.
 *
 * @returns The current user or null when the extension is signed out.
 * @example
 * const user = await fetchCurrentUser();
 */
const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const result = await getJson<AuthUser>(ME_ENDPOINT);
  return result.ok ? result.value : null;
};

/**
 * Current authenticated user for extension screens.
 *
 * @returns The current auth user plus the query loading state.
 * @example
 * const { user, loading } = useUser();
 */
export const useUser = (): { readonly user: AuthUser | null; readonly loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
  });
  return { user: data === undefined ? null : data, loading: isLoading };
};
