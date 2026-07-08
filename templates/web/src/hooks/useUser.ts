import { getJson } from '@/lib/fetchJson';
import type { AuthUser } from '@vybekiit/auth';
import { queryKeys } from '@vybekiit/client-state';
import { useQuery } from '@tanstack/react-query';

/** Where the current-user lookup is served from once sign-in is wired. */
const ME_ENDPOINT = '/api/auth/me';

const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const result = await getJson<AuthUser>(ME_ENDPOINT);
  return result.ok ? result.value : null;
};

/**
 * Current authenticated user for client components.
 *
 * Uses TanStack Query via `@vybekiit/client-state` defaults. Failures resolve to
 * `user: null` so signed-out and not-yet-wired look the same to the UI.
 *
 * @returns The current auth user plus the query loading state.
 * @example
 * const { user, loading } = useUser();
 */
const useUser = (): { readonly user: AuthUser | null; readonly loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
  });
  return { user: data === undefined ? null : data, loading: isLoading };
};

export { useUser };
