import { getJson } from '@/lib/fetch-json';
import type { AuthUser } from '@vybekiit/auth';
import { useQuery } from '@tanstack/react-query';

const ME_ENDPOINT = '/api/auth/me';

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const result = await getJson<AuthUser>(ME_ENDPOINT);
  return result.ok ? result.value : null;
}

export function useUser(): { user: AuthUser | null; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
  });
  return { user: data ?? null, loading: isLoading };
}
