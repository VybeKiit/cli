import { createClient } from '@supabase/supabase-js';
import type { SupabaseAuthConfig } from '@vybekiit/auth/config';
import { type AuthProviderResult, toEffectAuthProvider } from '@vybekiit/auth/effectBridge';
import { type AuthSession, toSessionResult } from '@vybekiit/auth/session';
import type { AuthProvider } from '@vybekiit/auth/types';
import { type AuthUser, normalizeAuthUser } from '@vybekiit/auth/user';
import { fail, ok, type Result } from '@vybekiit/core';

/** The GoTrue user shape this adapter reads (id + optional email). */
interface SupabaseUserLike {
  readonly id: string;
  readonly email?: string | null;
}

/** The GoTrue session shape this adapter reads (just the bearer token). */
interface SupabaseSessionLike {
  readonly access_token: string;
}

/** A GoTrue error — only its message is surfaced. */
interface SupabaseAuthError {
  readonly message: string;
}

/** A GoTrue call that establishes (or reads) a user/session. */
interface AuthResponse {
  readonly data: {
    readonly user: SupabaseUserLike | null;
    readonly session?: SupabaseSessionLike | null;
  };
  readonly error: SupabaseAuthError | null;
}

/** A GoTrue call that only reports success/failure (OTP send, reset email). */
interface SendResponse {
  readonly error: SupabaseAuthError | null;
}

/** The `verifyOtp` shapes this adapter issues (email/sms code, or a recovery/magic-link hash). */
type VerifyOtpParams =
  | { readonly email: string; readonly token: string; readonly type: 'email' }
  | { readonly phone: string; readonly token: string; readonly type: 'sms' }
  | { readonly token_hash: string; readonly type: 'recovery' | 'magiclink' };

/**
 * The narrow slice of Supabase's GoTrue `auth` client this adapter calls. Typed
 * structurally (not against `@supabase/supabase-js`'s deep generics) so a unit test can
 * inject a fake `{ auth: {...} }` and run with NO network; the real client is adapted at
 * {@link buildSupabaseAuthClient} via the sanctioned vendor-seam cast.
 */
export interface SupabaseAuthClientLike {
  readonly auth: {
    signUp(credentials: { email: string; password: string }): Promise<AuthResponse>;
    signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>;
    signInWithOtp(credentials: { email: string } | { phone: string }): Promise<SendResponse>;
    verifyOtp(params: VerifyOtpParams): Promise<AuthResponse>;
    resetPasswordForEmail(email: string): Promise<SendResponse>;
    updateUser(attributes: { password: string }): Promise<AuthResponse>;
    getUser(jwt?: string): Promise<AuthResponse>;
  };
}

/**
 * Settings for {@link createSupabaseAuthProvider}: the validated Supabase project URL +
 * anon key, plus an optional injected client (default: a real GoTrue client). Injecting
 * the client is the test seam that keeps construction offline.
 */
export interface SupabaseAuthProviderOptions {
  readonly config: SupabaseAuthConfig;
  /** Test seam — a fake `{ auth }` whose methods are mocked; omit to build the real one. */
  readonly client?: SupabaseAuthClientLike;
}

/** Supabase Auth covers the full sign-in surface (email code, magic link, password reset, SMS). */
const SUPABASE_CAPABILITIES = {
  emailCode: true,
  passwordReset: true,
  magicLink: true,
  sms: true,
} as const;

/**
 * Build the Supabase Auth {@link AuthProvider} — the default sign-in engine for the
 * default Supabase stack (ADR-0024), behind the same interface as better-auth/Cognito
 * so feature code never branches.
 *
 * Method → GoTrue mapping: password sign-up/in → `signUp`/`signInWithPassword`; email &
 * magic-link & SMS codes → `signInWithOtp` + `verifyOtp`; password reset → recovery
 * `verifyOtp` then `updateUser`; `getUser` → `getUser(jwt)`. Every GoTrue error is
 * narrated as a {@link Result} `fail(...)` rather than thrown across the boundary.
 */
export function createSupabaseAuthProvider(options: SupabaseAuthProviderOptions): AuthProvider {
  const { auth } = options.client ?? buildSupabaseAuthClient(options.config);

  const impl: AuthProviderResult = {
    name: 'supabase',
    capabilities: SUPABASE_CAPABILITIES,

    async signUpWithPassword(email: string, password: string) {
      const { data, error } = await auth.signUp({ email, password });
      if (error) return fail('signup_failed', error.message);
      return sessionFrom(
        data,
        email,
        'Sign up succeeded but returned no session (confirm your email).',
      );
    },

    async signInWithPassword(email: string, password: string) {
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) return fail('signin_failed', error.message);
      return sessionFrom(data, email, 'Sign in returned no session.');
    },

    async sendEmailCode(email: string): Promise<Result<true>> {
      const { error } = await auth.signInWithOtp({ email });
      if (error) return fail('otp_send_failed', error.message);
      return ok(true);
    },

    async verifyEmailCode(email: string, code: string) {
      const { data, error } = await auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) return fail('otp_verify_failed', error.message);
      return sessionFrom(data, email, 'Code verified but returned no session.');
    },

    async requestPasswordReset(email: string): Promise<Result<true>> {
      const { error } = await auth.resetPasswordForEmail(email);
      if (error) return fail('reset_request_failed', error.message);
      return ok(true);
    },

    async resetPassword(token: string, newPassword: string) {
      const recovery = await auth.verifyOtp({ token_hash: token, type: 'recovery' });
      if (recovery.error) return fail('reset_failed', recovery.error.message);
      const { data, error } = await auth.updateUser({ password: newPassword });
      if (error) return fail('reset_failed', error.message);
      return sessionFrom(data, '', 'Password reset succeeded but returned no session.');
    },

    async sendMagicLink(email: string): Promise<Result<true>> {
      const { error } = await auth.signInWithOtp({ email });
      if (error) return fail('magic_link_failed', error.message);
      return ok(true);
    },

    async verifyMagicLink(token: string) {
      const { data, error } = await auth.verifyOtp({ token_hash: token, type: 'magiclink' });
      if (error) return fail('magic_link_failed', error.message);
      return sessionFrom(data, '', 'Magic link verified but returned no session.');
    },

    async sendSmsCode(phone: string): Promise<Result<true>> {
      const { error } = await auth.signInWithOtp({ phone });
      if (error) return fail('sms_send_failed', error.message);
      return ok(true);
    },

    async verifySmsCode(phone: string, code: string) {
      const { data, error } = await auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) return fail('sms_verify_failed', error.message);
      return sessionFrom(data, '', 'SMS verified but returned no session.');
    },

    async getUser(sessionToken: string): Promise<Result<AuthUser>> {
      const { data, error } = await auth.getUser(sessionToken);
      if (error) return fail('get_user_failed', error.message);
      const user = normalizeAuthUser(data.user);
      return user ? ok(user) : fail('no_user', 'No user for the given session token.');
    },
  };
  return toEffectAuthProvider(impl);
}

/** Map a GoTrue `{ user, session }` payload into a {@link Result} session. */
function sessionFrom(
  data: { readonly user: SupabaseUserLike | null; readonly session?: SupabaseSessionLike | null },
  fallbackEmail: string,
  noUserMessage: string,
): Result<AuthSession> {
  return toSessionResult(
    data.user ? { id: data.user.id, email: data.user.email ?? fallbackEmail } : null,
    data.session?.access_token,
    noUserMessage,
  );
}

/** Construct the real GoTrue client (stateless server-side; no session persistence). */
function buildSupabaseAuthClient(config: SupabaseAuthConfig): SupabaseAuthClientLike {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseAuthClientLike;
}
