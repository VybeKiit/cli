import { getJson } from '@/lib/apiClient';
import type { AuthUser } from '@vybekiit/auth';
import { queryKeys } from '@vybekiit/client-state';
import { useQuery } from '@tanstack/react-query';

const ME_ENDPOINT = '/api/auth/me';

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const result = await getJson<AuthUser>(ME_ENDPOINT);
  return result.ok ? result.value : null;
}

export function useUser(): { user: AuthUser | null; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
  });
  return { user: data ?? null, loading: isLoading };
}
