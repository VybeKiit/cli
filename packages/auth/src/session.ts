import { fail, ok, type Result } from '@vybekiit/core';
import { type AuthUser, normalizeAuthUser } from './user';

/** Signed-in state returned by session-establishing {@link AuthProvider} methods. */
export type AuthSession = {
  readonly user: AuthUser;
  /** Value persisted in the session cookie and passed to {@link AuthProvider.getUser}. */
  readonly sessionToken: string;
};

/** Fixed session marker for the local dev adapter (ADR-0008). */
export const LOCAL_DEV_SESSION_TOKEN = 'local-dev-session';

/** Map a provider user + token pair into a {@link Result} session. */
export function toSessionResult(
  raw: { id: string; email: string } | null | undefined,
  sessionToken: string | null | undefined,
  noUserMessage: string,
): Result<AuthSession> {
  const user = normalizeAuthUser(raw);
  const token = sessionToken?.trim();
  if (!(user && token)) return fail('no_user', noUserMessage);
  return ok({ user, sessionToken: token });
}

/** User JSON for HTTP responses — never exposes {@link AuthSession.sessionToken}. */
export function userFromSession(session: AuthSession): AuthUser {
  return session.user;
}
