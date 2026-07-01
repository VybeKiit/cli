import type { Result } from '@vybekiit/core';
import { Effect } from 'effect';
import type { AuthSession } from './session';
import {
  AuthError,
  type AuthCapabilities,
  type AuthProvider,
  type AuthProviderName,
} from './types';
import type { AuthUser } from './user';

/**
 * The internal, `Result`-returning shape each adapter builds. {@link toEffectAuthProvider}
 * lifts it to the Effect {@link AuthProvider} the interface now exposes (ADR-0023), so
 * every adapter body stays proven and byte-identical behind this one seam. Both this
 * file and `Result` retire in Slice 8.
 */
export interface AuthProviderResult {
  readonly name: AuthProviderName;
  readonly capabilities: AuthCapabilities;
  signUpWithPassword(email: string, password: string): Promise<Result<AuthSession>>;
  signInWithPassword(email: string, password: string): Promise<Result<AuthSession>>;
  sendEmailCode(email: string): Promise<Result<true>>;
  verifyEmailCode(email: string, code: string): Promise<Result<AuthSession>>;
  requestPasswordReset(email: string): Promise<Result<true>>;
  resetPassword(token: string, newPassword: string): Promise<Result<AuthSession>>;
  sendMagicLink(email: string): Promise<Result<true>>;
  verifyMagicLink(token: string): Promise<Result<AuthSession>>;
  sendSmsCode(phone: string): Promise<Result<true>>;
  verifySmsCode(phone: string, code: string): Promise<Result<AuthSession>>;
  getUser(sessionToken: string): Promise<Result<AuthUser>>;
}

/** Lift a `Result`-returning adapter body into the `Effect` the interface returns. */
function fromResultPromise<T>(promise: Promise<Result<T>>): Effect.Effect<T, AuthError> {
  return Effect.flatMap(
    Effect.promise(() => promise),
    (result) =>
      result.ok ? Effect.succeed(result.value) : Effect.fail(new AuthError(result.error)),
  );
}

/**
 * Wrap a {@link AuthProviderResult} as the public {@link AuthProvider} — every method
 * lifted through {@link fromResultPromise} once, so adapters keep returning `Result`
 * from their proven bodies while callers get an `Effect`.
 */
export function toEffectAuthProvider(impl: AuthProviderResult): AuthProvider {
  return {
    name: impl.name,
    capabilities: impl.capabilities,
    signUpWithPassword: (email, password) =>
      fromResultPromise(impl.signUpWithPassword(email, password)),
    signInWithPassword: (email, password) =>
      fromResultPromise(impl.signInWithPassword(email, password)),
    sendEmailCode: (email) => fromResultPromise(impl.sendEmailCode(email)),
    verifyEmailCode: (email, code) => fromResultPromise(impl.verifyEmailCode(email, code)),
    requestPasswordReset: (email) => fromResultPromise(impl.requestPasswordReset(email)),
    resetPassword: (token, newPassword) =>
      fromResultPromise(impl.resetPassword(token, newPassword)),
    sendMagicLink: (email) => fromResultPromise(impl.sendMagicLink(email)),
    verifyMagicLink: (token) => fromResultPromise(impl.verifyMagicLink(token)),
    sendSmsCode: (phone) => fromResultPromise(impl.sendSmsCode(phone)),
    verifySmsCode: (phone, code) => fromResultPromise(impl.verifySmsCode(phone, code)),
    getUser: (sessionToken) => fromResultPromise(impl.getUser(sessionToken)),
  };
}
