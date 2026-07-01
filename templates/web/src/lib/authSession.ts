import { cookies } from 'next/headers';
import { readNodeEnv } from './nodeEnv';

/**
 * Server-only session-cookie helpers shared by the `/api/auth/*` routes.
 *
 * The kit ships with the no-secrets **local** auth adapter as the default
 * (ADR-0008), so a freshly scaffolded app signs in offline as a dev user. These
 * routes mint a session marker on success and read it back in `/api/auth/me`; the
 * marker is the value `AuthProvider.getUser` is called with. The local adapter
 * treats any non-empty marker as its dev user, so the dashboard lights up with no
 * `.env`. The `add-signin` skill swaps the body for the chosen backend's real
 * session token without touching the screens that consume `/api/auth/me`.
 *
 * This module imports `next/headers`, so importing it from a client bundle is a
 * build error — the cookie surface can never leak into the browser.
 */

/** Name of the httpOnly cookie holding the session marker / token. */
const SESSION_COOKIE = 'vk_session';

/** Persist a session marker for the signed-in user (httpOnly, lax, site-wide). */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: readNodeEnv().NODE_ENV === 'production',
  });
}

/** Read the current session marker, or `null` when the visitor is signed out. */
export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** Clear the session marker (sign-out). */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
