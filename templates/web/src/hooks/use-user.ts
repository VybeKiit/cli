import { getJson } from '@/lib/fetch-json';
import type { AuthUser } from '@vybekiit/auth';
import { queryKeys } from '@vybekiit/client-state';
import { useQuery } from '@tanstack/react-query';

/** Where the current-user lookup is served from once sign-in is wired. */
const ME_ENDPOINT = '/api/auth/me';

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const result = await getJson<AuthUser>(ME_ENDPOINT);
  return result.ok ? result.value : null;
}

/**
 * Current authenticated user for client components.
 *
 * Uses TanStack Query via `@vybekiit/client-state` defaults. Failures resolve to
 * `user: null` so signed-out and not-yet-wired look the same to the UI.
 */
export function useUser(): { user: AuthUser | null; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
  });
  return { user: data ?? null, loading: isLoading };
}
