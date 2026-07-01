import { Data, type Effect } from 'effect';
import type { AuthSession } from './session';
import type { AuthUser } from './user';

export type AuthProviderName = 'better-auth' | 'cognito' | 'local';

/**
 * The tagged failure every {@link AuthProvider} method can produce (ADR-0023).
 * Carries the adapter's stable `code` (routed to telemetry) and a buyer-safe
 * `message`. Replaces the old `Result`-carried `VybeKiitError` on this seam.
 */
export class AuthError extends Data.TaggedError('AuthError')<{
  readonly code: string;
  readonly message: string;
}> {}

/** Which extended auth flows the active adapter implements (not stubs). */
export type AuthCapabilities = {
  readonly emailCode: boolean;
  readonly passwordReset: boolean;
  readonly magicLink: boolean;
  readonly sms: boolean;
};

/**
 * The swappable auth seam — one interface every call site and skill talks to.
 * Session-establishing methods yield an {@link AuthSession}; HTTP layers persist
 * `sessionToken` in a cookie and return `user` to the client. Each method is an
 * {@link Effect.Effect} that fails with a tagged {@link AuthError}; composition
 * roots run it with `Effect.runPromiseExit` at the edge.
 */
export interface AuthProvider {
  readonly name: AuthProviderName;
  readonly capabilities: AuthCapabilities;
  signUpWithPassword(email: string, password: string): Effect.Effect<AuthSession, AuthError>;
  signInWithPassword(email: string, password: string): Effect.Effect<AuthSession, AuthError>;
  sendEmailCode(email: string): Effect.Effect<true, AuthError>;
  verifyEmailCode(email: string, code: string): Effect.Effect<AuthSession, AuthError>;
  requestPasswordReset(email: string): Effect.Effect<true, AuthError>;
  resetPassword(token: string, newPassword: string): Effect.Effect<AuthSession, AuthError>;
  sendMagicLink(email: string): Effect.Effect<true, AuthError>;
  verifyMagicLink(token: string): Effect.Effect<AuthSession, AuthError>;
  sendSmsCode(phone: string): Effect.Effect<true, AuthError>;
  verifySmsCode(phone: string, code: string): Effect.Effect<AuthSession, AuthError>;
  getUser(sessionToken: string): Effect.Effect<AuthUser, AuthError>;
}
