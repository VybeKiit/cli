import { type AuthSession, failAuth, LOCAL_DEV_SESSION_TOKEN } from '@vybekiit/auth/session';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import type { AuthUser } from '@vybekiit/auth/user';
import { Effect } from 'effect';

const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };
const resetTokens = new Map<string, string>();
const magicTokens = new Map<string, string>();

const LOCAL_CAPABILITIES = {
  emailCode: true,
  passwordReset: true,
  magicLink: true,
  sms: true,
} as const;

const okSession = (): Effect.Effect<AuthSession, AuthError> =>
  Effect.succeed({ user: DEV_USER, sessionToken: LOCAL_DEV_SESSION_TOKEN });

/**
 * Create the local development auth provider.
 *
 * @returns An AuthProvider backed by deterministic local sessions.
 * @example
 * const provider = createLocalAuthProvider();
 */
export const createLocalAuthProvider = (): AuthProvider => ({
  name: 'local',
  capabilities: LOCAL_CAPABILITIES,
  signUpWithPassword: () => okSession(),
  signInWithPassword: () => okSession(),
  sendEmailCode: () => Effect.succeed(true),
  verifyEmailCode: () => okSession(),
  requestPasswordReset: (email) =>
    Effect.sync(() => {
      resetTokens.set('local-reset-token', email);
      return true as const;
    }),
  resetPassword: (token) => {
    if (token !== 'local-reset-token' && !resetTokens.has(token)) {
      return failAuth('reset_failed', 'That reset link is not valid.');
    }
    return okSession();
  },
  sendMagicLink: (email) =>
    Effect.sync(() => {
      magicTokens.set('local-magic-token', email);
      return true as const;
    }),
  verifyMagicLink: (token) => {
    if (token !== 'local-magic-token' && !magicTokens.has(token)) {
      return failAuth('magic_link_failed', 'That sign-in link is not valid.');
    }
    return okSession();
  },
  sendSmsCode: () => Effect.succeed(true),
  verifySmsCode: () => okSession(),
  getUser: (sessionToken) => {
    if (sessionToken.length === 0) {
      return failAuth('no_user', 'No session token provided.');
    }
    return Effect.succeed(DEV_USER);
  },
});
