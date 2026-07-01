import { type Result, fail, ok } from '@vybekiit/core';
import { type AuthProviderResult, toEffectAuthProvider } from '../../effect-bridge';
import type { AuthProvider } from '../../types';
import type { AuthUser } from '../../user';
import { LOCAL_DEV_SESSION_TOKEN, type AuthSession, toSessionResult } from '../../session';

const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };
const resetTokens = new Map<string, string>();
const magicTokens = new Map<string, string>();

const LOCAL_CAPABILITIES = {
  emailCode: true,
  passwordReset: true,
  magicLink: true,
  sms: true,
} as const;

function okSession(): Promise<Result<AuthSession>> {
  return Promise.resolve(ok({ user: DEV_USER, sessionToken: LOCAL_DEV_SESSION_TOKEN }));
}

export function createLocalAuthProvider(): AuthProvider {
  const impl: AuthProviderResult = {
    name: 'local',
    capabilities: LOCAL_CAPABILITIES,

    signUpWithPassword(): Promise<Result<AuthSession>> {
      return okSession();
    },

    signInWithPassword(): Promise<Result<AuthSession>> {
      return okSession();
    },

    sendEmailCode(): Promise<Result<true>> {
      return Promise.resolve(ok(true));
    },

    verifyEmailCode(): Promise<Result<AuthSession>> {
      return okSession();
    },

    requestPasswordReset(email: string): Promise<Result<true>> {
      resetTokens.set('local-reset-token', email);
      return Promise.resolve(ok(true));
    },

    resetPassword(token: string, _newPassword: string): Promise<Result<AuthSession>> {
      if (token !== 'local-reset-token' && !resetTokens.has(token)) {
        return Promise.resolve(fail('reset_failed', 'That reset link is not valid.'));
      }
      return okSession();
    },

    sendMagicLink(email: string): Promise<Result<true>> {
      magicTokens.set('local-magic-token', email);
      return Promise.resolve(ok(true));
    },

    verifyMagicLink(token: string): Promise<Result<AuthSession>> {
      if (token !== 'local-magic-token' && !magicTokens.has(token)) {
        return Promise.resolve(fail('magic_link_failed', 'That sign-in link is not valid.'));
      }
      return okSession();
    },

    sendSmsCode(_phone: string): Promise<Result<true>> {
      return Promise.resolve(ok(true));
    },

    verifySmsCode(_phone: string, _code: string): Promise<Result<AuthSession>> {
      return okSession();
    },

    getUser(sessionToken: string): Promise<Result<AuthUser>> {
      if (!sessionToken) return Promise.resolve(fail('no_user', 'No session token provided.'));
      return Promise.resolve(ok(DEV_USER));
    },
  };
  return toEffectAuthProvider(impl);
}
