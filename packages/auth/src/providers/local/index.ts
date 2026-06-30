import { type Result, fail, ok } from '@vybekiit/core';
import type { AuthProvider } from '../../types';
import type { AuthUser } from '../../user';

const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };
const resetTokens = new Map<string, string>();
const magicTokens = new Map<string, string>();

function okUser(): Promise<Result<AuthUser>> {
  return Promise.resolve(ok(DEV_USER));
}

export function createLocalAuthProvider(): AuthProvider {
  return {
    name: 'local',

    signUpWithPassword(): Promise<Result<AuthUser>> {
      return okUser();
    },

    signInWithPassword(): Promise<Result<AuthUser>> {
      return okUser();
    },

    sendEmailCode(): Promise<Result<true>> {
      return Promise.resolve(ok(true));
    },

    verifyEmailCode(): Promise<Result<AuthUser>> {
      return okUser();
    },

    requestPasswordReset(email: string): Promise<Result<true>> {
      resetTokens.set('local-reset-token', email);
      return Promise.resolve(ok(true));
    },

    resetPassword(token: string, _newPassword: string): Promise<Result<AuthUser>> {
      if (token !== 'local-reset-token' && !resetTokens.has(token)) {
        return Promise.resolve(fail('reset_failed', 'That reset link is not valid.'));
      }
      return okUser();
    },

    sendMagicLink(email: string): Promise<Result<true>> {
      magicTokens.set('local-magic-token', email);
      return Promise.resolve(ok(true));
    },

    verifyMagicLink(token: string): Promise<Result<AuthUser>> {
      if (token !== 'local-magic-token' && !magicTokens.has(token)) {
        return Promise.resolve(fail('magic_link_failed', 'That sign-in link is not valid.'));
      }
      return okUser();
    },

    sendSmsCode(_phone: string): Promise<Result<true>> {
      return Promise.resolve(ok(true));
    },

    verifySmsCode(_phone: string, _code: string): Promise<Result<AuthUser>> {
      return okUser();
    },

    getUser(sessionToken: string): Promise<Result<AuthUser>> {
      if (!sessionToken) return Promise.resolve(fail('no_user', 'No session token provided.'));
      return okUser();
    },
  };
}
