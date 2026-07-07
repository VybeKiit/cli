import { Effect } from 'effect';
import { AuthError } from './types';
import { type AuthUser, normalizeAuthUser } from './user';

/** Signed-in state returned by session-establishing {@link AuthProvider} methods. */
export type AuthSession = {
  readonly user: AuthUser;
  /** Value persisted in the session cookie and passed to {@link AuthProvider.getUser}. */
  readonly sessionToken: string;
};

/** Fixed session marker for the local dev adapter (ADR-0008). */
export const LOCAL_DEV_SESSION_TOKEN = 'local-dev-session';

/**
 * Build a tagged auth error.
 *
 * @param code - Stable auth error code.
 * @param message - Buyer-safe failure message.
 * @returns The tagged AuthError instance.
 * @example
 * const error = authError('no_user', 'No user for this session.');
 */
export const authError = (code: string, message: string): AuthError =>
  new AuthError({ code, message });

/**
 * Fail an auth Effect with a tagged AuthError.
 *
 * @param code - Stable auth error code.
 * @param message - Buyer-safe failure message.
 * @returns An Effect that fails with AuthError.
 * @example
 * const effect = failAuth('no_user', 'No user for this session.');
 */
export const failAuth = <A = never>(code: string, message: string): Effect.Effect<A, AuthError> =>
  Effect.fail(authError(code, message));

/**
 * Map a provider user + token pair into an Effect session.
 *
 * @param raw - Provider user payload.
 * @param sessionToken - Session token from the provider.
 * @param noUserMessage - Failure message when user or token is missing.
 * @returns An Effect that succeeds with AuthSession or fails with AuthError.
 * @example
 * const session = toAuthSession(user, token, 'No session was returned.');
 */
export const toAuthSession = (
  raw: { id: string; email: string } | null | undefined,
  sessionToken: string | null | undefined,
  noUserMessage: string,
): Effect.Effect<AuthSession, AuthError> => {
  const user = normalizeAuthUser(raw);
  const token =
    sessionToken === null || sessionToken === undefined ? undefined : sessionToken.trim();
  if (user === null || token === undefined || token.length === 0) {
    return failAuth('no_user', noUserMessage);
  }
  return Effect.succeed({ user, sessionToken: token });
};

/**
 * User JSON for HTTP responses — never exposes {@link AuthSession.sessionToken}.
 *
 * @param session - Auth session to project.
 * @returns The public authenticated user.
 * @example
 * const user = userFromSession(session);
 */
export const userFromSession = (session: AuthSession): AuthUser => session.user;
