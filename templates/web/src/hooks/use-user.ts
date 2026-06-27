import { getJson } from '@/lib/fetch-json';
import type { AuthUser } from '@vybekiit/auth';
import { useEffect, useState } from 'react';

/** Where the current-user lookup is served from once sign-in is wired. */
const ME_ENDPOINT = '/api/auth/me';

/**
 * Current authenticated user for client components.
 *
 * Reads `/api/auth/me` through the typed fetch helper. That route does NOT exist
 * until the `add-signin` skill creates it, so any failure (404 before wiring,
 * network error, or a signed-out visitor) resolves to `user: null` — never an
 * error state. This keeps signed-out and not-yet-wired indistinguishable to the
 * UI: it simply renders the logged-out view. The hook "lights up" automatically
 * once sign-in is wired and the route starts returning an {@link AuthUser}.
 *
 * @returns `{ user, loading }` — `user` is `null` until a real session resolves.
 */
export function useUser(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<AuthUser>(ME_ENDPOINT).then((result) => {
      if (!active) return;
      setUser(result.ok ? result.value : null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
