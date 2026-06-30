import type { Result } from '@vybekiit/core';
import type { AuthUser } from './user';

export type AuthProviderName = 'better-auth' | 'cognito' | 'local';

/**
 * The swappable auth seam — one interface every call site and skill talks to.
 */
export interface AuthProvider {
  readonly name: AuthProviderName;
  signUpWithPassword(email: string, password: string): Promise<Result<AuthUser>>;
  signInWithPassword(email: string, password: string): Promise<Result<AuthUser>>;
  sendEmailCode(email: string): Promise<Result<true>>;
  verifyEmailCode(email: string, code: string): Promise<Result<AuthUser>>;
  requestPasswordReset(email: string): Promise<Result<true>>;
  resetPassword(token: string, newPassword: string): Promise<Result<AuthUser>>;
  sendMagicLink(email: string): Promise<Result<true>>;
  verifyMagicLink(token: string): Promise<Result<AuthUser>>;
  sendSmsCode(phone: string): Promise<Result<true>>;
  verifySmsCode(phone: string, code: string): Promise<Result<AuthUser>>;
  getUser(sessionToken: string): Promise<Result<AuthUser>>;
}
