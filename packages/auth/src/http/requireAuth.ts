import { resolveAuthProvider } from '@vybekiit/auth/resolve';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import type { AuthUser } from '@vybekiit/auth/user';
import { unauthorized } from '@vybekiit/core/http';
import { Effect, Exit } from 'effect';

/** Dependencies for package-owned requireAuth helpers. */
export type RequireAuthDeps = {
  readonly resolveAuth?: () => Effect.Effect<AuthProvider, AuthError>;
  readonly readToken: () => Promise<string | null> | string | null;
};

/**
 * Resolve the current user from a session token, or an unauthorized response body shape.
 *
 * Deep package edge for OWNED templates: Exit handling stays in maintained code.
 *
 * @param deps - Token reader and optional auth resolver.
 * @returns User on success, or `{ unauthorized: true, body }` for 401.
 * @example
 * const result = await resolveAuthenticatedUser({ readToken: () => cookie });
 */
export const resolveAuthenticatedUser = async (
  deps: RequireAuthDeps,
): Promise<
  | { readonly ok: true; readonly user: AuthUser }
  | { readonly ok: false; readonly body: { readonly code: string; readonly error: string } }
> => {
  const token = await deps.readToken();
  if (token === null || token.length === 0) {
    const response = unauthorized('Sign in required.');
    return { ok: false, body: response.body };
  }

  const resolve = deps.resolveAuth === undefined ? resolveAuthProvider() : deps.resolveAuth();
  const exit = await Effect.runPromiseExit(
    resolve.pipe(Effect.flatMap((auth) => auth.getUser(token))),
  );
  if (Exit.isFailure(exit)) {
    const response = unauthorized('Sign in required.');
    return { ok: false, body: response.body };
  }

  return { ok: true, user: exit.value };
};
