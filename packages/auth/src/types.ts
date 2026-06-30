import type { Result } from '@vybekiit/core';
import type { AuthSession } from './session';

export type AuthProviderName = 'better-auth' | 'cognito' | 'local';

/** Which extended auth flows the active adapter implements (not stubs). */
export type AuthCapabilities = {
  readonly emailCode: boolean;
  readonly passwordReset: boolean;
  readonly magicLink: boolean;
  readonly sms: boolean;
};

/**
 * The swappable auth seam — one interface every call site and skill talks to.
 * Session-establishing methods return {@link AuthSession}; HTTP layers persist
 * `sessionToken` in a cookie and return `user` to the client.
 */
export interface AuthProvider {
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
  getUser(sessionToken: string): Promise<Result<import('./user').AuthUser>>;
}
