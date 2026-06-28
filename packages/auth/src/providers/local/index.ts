import { type Result, fail, ok } from '@vybekiit/core';
import type { AuthProvider } from '../../types';
import type { AuthUser } from '../../user';

/**
 * The single fixed identity the local adapter signs everyone in as. The email and
 * id are intentionally obvious dev placeholders so a builder (and our screens) can
 * tell at a glance this is practice mode, not a real account (ADR-0008).
 */
const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };

/**
 * Build the zero-config local {@link AuthProvider} — VybeKiit's no-secrets dev
 * fallback (ADR-0008). It takes no config and reaches no network: a freshly
 * scaffolded app with no auth backend resolves to this so the very first `pnpm dev`
 * can sign in and render the dashboard, and it doubles as the network-free
 * contract-conformance fixture for the {@link AuthProvider} interface.
 *
 * It is **intentionally permissive** — every sign-in/sign-up/OTP path succeeds and
 * returns the same {@link DEV_USER}, because this is local practice mode, not a
 * security boundary. `getUser` treats any non-empty session token as that dev user
 * and only an empty token as `no_user`. Real identity arrives the moment the
 * `add-signin` skill wires a real backend (the screens then "remember you for real").
 */
export function createLocalAuthProvider(): AuthProvider {
  return {
    name: 'local',

    signUpWithPassword(): Promise<Result<AuthUser>> {
      return Promise.resolve(ok(DEV_USER));
    },

    signInWithPassword(): Promise<Result<AuthUser>> {
      return Promise.resolve(ok(DEV_USER));
    },

    sendEmailCode(): Promise<Result<true>> {
      return Promise.resolve(ok(true));
    },

    verifyEmailCode(): Promise<Result<AuthUser>> {
      return Promise.resolve(ok(DEV_USER));
    },

    getUser(sessionToken: string): Promise<Result<AuthUser>> {
      if (!sessionToken) return Promise.resolve(fail('no_user', 'No session token provided.'));
      return Promise.resolve(ok(DEV_USER));
    },
  };
}
