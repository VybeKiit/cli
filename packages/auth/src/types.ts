import type { Result } from '@vybekiit/core';
import type { AuthUser } from './user';

/**
 * The auth backends VybeKiit ships an adapter for. A buyer runs exactly one at a
 * time; the agent's add-signin skill selects it (driven by `AUTH_PROVIDER` and the
 * active `DATA_PROVIDER`, ADR-0003). `better-auth` is the DB-bound default — its
 * tables live in the same database the builder's data uses — and `cognito` is the
 * AWS path for apps whose data lives in DynamoDB (which has no better-auth adapter).
 */
export type AuthProviderName = 'better-auth' | 'cognito';

/**
 * The swappable auth seam — the single interface every call site (and the
 * `add-signin` skill) talks to, so feature code never names better-auth or Cognito.
 * Mirrors {@link import('@vybekiit/payments').PaymentProvider}: each adapter is
 * constructed from its own validated config (secrets + DB binding live in the
 * factory, not per call), so every method is credential-free at the call site and
 * uniform across providers.
 *
 * Every method returns a {@link Result} rather than throwing: auth failures (wrong
 * password, email taken, bad/expired code, unknown session) are *expected* boundary
 * outcomes a skill must translate to plain language, so an adapter narrates them via
 * `fail(...)` and never lets a provider exception cross this boundary. The stable
 * failure codes are: `signin_failed`, `signup_failed`, `get_user_failed`, `no_user`,
 * `otp_send_failed`, `otp_verify_failed`.
 *
 * The method set is the exact contract `templates/web/src/lib/auth-client.ts`
 * consumes, so the add-signin skill can wire each web stub straight to a call here.
 */
export interface AuthProvider {
  /** Which backend this instance talks to. */
  readonly name: AuthProviderName;
  /** Create an account with email + password, normalized to an {@link AuthUser}. */
  signUpWithPassword(email: string, password: string): Promise<Result<AuthUser>>;
  /** Sign in with email + password, normalized to an {@link AuthUser}. */
  signInWithPassword(email: string, password: string): Promise<Result<AuthUser>>;
  /** Send a one-time login code to an email address (passwordless sign-in). */
  sendEmailCode(email: string): Promise<Result<true>>;
  /** Verify a one-time login code and resolve the signed-in {@link AuthUser}. */
  verifyEmailCode(email: string, code: string): Promise<Result<AuthUser>>;
  /**
   * Resolve the current user from a session/access token — used in server routes to
   * protect a request. Returns `no_user` when the token maps to no live session.
   */
  getUser(sessionToken: string): Promise<Result<AuthUser>>;
}
