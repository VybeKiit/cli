import type { AuthUser } from './user';
import { type Result, fail, ok } from '@vybekiit/core';

/** Server routes buyer-facing auth clients call; one place so they never drift. */
export const AUTH_CLIENT_ROUTES = {
  signIn: '/api/auth/signin',
  signUp: '/api/auth/signup',
  sendCode: '/api/auth/send-code',
  verify: '/api/auth/verify',
  signOut: '/api/auth/signout',
} as const;

export type AuthClientPostJson = <T>(url: string, body: unknown) => Promise<Result<T>>;

/** Factory shared by web, mobile, and SPA auth-client wire points. */
export function createAuthClient(postJson: AuthClientPostJson) {
  return {
    async signInWithPassword(email: string, password: string): Promise<Result<AuthUser>> {
      if (!(email && password)) {
        return fail('invalid_input', 'auth.errors.enterEmailAndPassword');
      }
      return postJson<AuthUser>(AUTH_CLIENT_ROUTES.signIn, { email, password });
    },

    async signUpWithPassword(email: string, password: string): Promise<Result<AuthUser>> {
      if (!(email && password)) {
        return fail('invalid_input', 'auth.errors.enterEmailAndPassword');
      }
      return postJson<AuthUser>(AUTH_CLIENT_ROUTES.signUp, { email, password });
    },

    async sendEmailCode(email: string): Promise<Result<true>> {
      if (!email) {
        return fail('invalid_input', 'auth.errors.enterEmail');
      }
      const result = await postJson<{ ok: true }>(AUTH_CLIENT_ROUTES.sendCode, { email });
      return result.ok ? ok(true) : result;
    },

    async verifyEmailCode(email: string, code: string): Promise<Result<AuthUser>> {
      if (!(email && code)) {
        return fail('invalid_input', 'auth.errors.enterCode');
      }
      return postJson<AuthUser>(AUTH_CLIENT_ROUTES.verify, { email, code });
    },

    async signOut(): Promise<Result<true>> {
      const result = await postJson<{ ok: true }>(AUTH_CLIENT_ROUTES.signOut, {});
      return result.ok ? ok(true) : result;
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
