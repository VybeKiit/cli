import { Data, type Effect } from 'effect';
import type { AuthSession } from './session';
import type { AuthUser } from './user';

export type AuthProviderName = 'supabase' | 'better-auth' | 'cognito' | 'local';

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
export type AuthProvider = {
  readonly name: AuthProviderName;
  readonly capabilities: AuthCapabilities;
  readonly signUpWithPassword: (
    email: string,
    password: string,
  ) => Effect.Effect<AuthSession, AuthError>;
  readonly signInWithPassword: (
    email: string,
    password: string,
  ) => Effect.Effect<AuthSession, AuthError>;
  readonly sendEmailCode: (email: string) => Effect.Effect<true, AuthError>;
  readonly verifyEmailCode: (email: string, code: string) => Effect.Effect<AuthSession, AuthError>;
  readonly requestPasswordReset: (email: string) => Effect.Effect<true, AuthError>;
  readonly resetPassword: (
    token: string,
    newPassword: string,
  ) => Effect.Effect<AuthSession, AuthError>;
  readonly sendMagicLink: (email: string) => Effect.Effect<true, AuthError>;
  readonly verifyMagicLink: (token: string) => Effect.Effect<AuthSession, AuthError>;
  readonly sendSmsCode: (phone: string) => Effect.Effect<true, AuthError>;
  readonly verifySmsCode: (phone: string, code: string) => Effect.Effect<AuthSession, AuthError>;
  readonly getUser: (sessionToken: string) => Effect.Effect<AuthUser, AuthError>;
};
