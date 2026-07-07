import { createClient } from '@supabase/supabase-js';
import type { SupabaseAuthConfig } from '@vybekiit/auth/config';
import { type AuthSession, authError, failAuth, toAuthSession } from '@vybekiit/auth/session';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import { normalizeAuthUser } from '@vybekiit/auth/user';
import { Effect } from 'effect';

/** The GoTrue user shape this adapter reads (id + optional email). */
type SupabaseUserLike = {
  readonly id: string;
  readonly email?: string | null;
};

/** The GoTrue session shape this adapter reads (just the bearer token). */
type SupabaseSessionLike = {
  readonly access_token: string;
};

/** A GoTrue error — only its message is surfaced. */
type SupabaseAuthError = {
  readonly message: string;
};

/** A GoTrue call that establishes (or reads) a user/session. */
type AuthResponse = {
  readonly data: {
    readonly user: SupabaseUserLike | null;
    readonly session?: SupabaseSessionLike | null;
  };
  readonly error: SupabaseAuthError | null;
};

/** A GoTrue call that only reports success/failure (OTP send, reset email). */
type SendResponse = {
  readonly error: SupabaseAuthError | null;
};

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
export type SupabaseAuthClientLike = {
  readonly auth: {
    readonly signUp: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
    readonly signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<AuthResponse>;
    readonly signInWithOtp: (
      credentials: { email: string } | { phone: string },
    ) => Promise<SendResponse>;
    readonly verifyOtp: (params: VerifyOtpParams) => Promise<AuthResponse>;
    readonly resetPasswordForEmail: (email: string) => Promise<SendResponse>;
    readonly updateUser: (attributes: { password: string }) => Promise<AuthResponse>;
    readonly getUser: (jwt?: string) => Promise<AuthResponse>;
  };
};

/**
 * Settings for {@link createSupabaseAuthProvider}: the validated Supabase project URL +
 * anon key, plus an optional injected client (default: a real GoTrue client). Injecting
 * the client is the test seam that keeps construction offline.
 */
export type SupabaseAuthProviderOptions = {
  readonly config: SupabaseAuthConfig;
  /** Test seam — a fake `{ auth }` whose methods are mocked; omit to build the real one. */
  readonly client?: SupabaseAuthClientLike;
};

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
 * narrated as tagged {@link AuthError} failures rather than thrown across the boundary.
 *
 * @param options - Validated config plus an optional injected GoTrue client.
 * @returns The Supabase AuthProvider.
 * @example
 * const provider = createSupabaseAuthProvider({ config });
 */
export const createSupabaseAuthProvider = (options: SupabaseAuthProviderOptions): AuthProvider => {
  const client =
    options.client === undefined ? buildSupabaseAuthClient(options.config) : options.client;
  const { auth } = client;

  return {
    name: 'supabase',
    capabilities: SUPABASE_CAPABILITIES,

    signUpWithPassword: (email, password) =>
      Effect.gen(function* () {
        const { data, error } = yield* trySupabase('signup_failed', () =>
          auth.signUp({ email, password }),
        );
        if (error !== null) {
          return yield* failAuth('signup_failed', error.message);
        }
        return yield* sessionFrom(
          data,
          email,
          'Sign up succeeded but returned no session (confirm your email).',
        );
      }),

    signInWithPassword: (email, password) =>
      Effect.gen(function* () {
        const { data, error } = yield* trySupabase('signin_failed', () =>
          auth.signInWithPassword({ email, password }),
        );
        if (error !== null) {
          return yield* failAuth('signin_failed', error.message);
        }
        return yield* sessionFrom(data, email, 'Sign in returned no session.');
      }),

    sendEmailCode: (email) =>
      Effect.gen(function* () {
        const { error } = yield* trySupabase('otp_send_failed', () =>
          auth.signInWithOtp({ email }),
        );
        if (error !== null) {
          return yield* failAuth('otp_send_failed', error.message);
        }
        return true as const;
      }),

    verifyEmailCode: (email, code) =>
      Effect.gen(function* () {
        const { data, error } = yield* trySupabase('otp_verify_failed', () =>
          auth.verifyOtp({ email, token: code, type: 'email' }),
        );
        if (error !== null) {
          return yield* failAuth('otp_verify_failed', error.message);
        }
        return yield* sessionFrom(data, email, 'Code verified but returned no session.');
      }),

    requestPasswordReset: (email) =>
      Effect.gen(function* () {
        const { error } = yield* trySupabase('reset_request_failed', () =>
          auth.resetPasswordForEmail(email),
        );
        if (error !== null) {
          return yield* failAuth('reset_request_failed', error.message);
        }
        return true as const;
      }),

    resetPassword: (token, newPassword) =>
      Effect.gen(function* () {
        const recovery = yield* trySupabase('reset_failed', () =>
          auth.verifyOtp({ token_hash: token, type: 'recovery' }),
        );
        if (recovery.error !== null) {
          return yield* failAuth('reset_failed', recovery.error.message);
        }
        const { data, error } = yield* trySupabase('reset_failed', () =>
          auth.updateUser({ password: newPassword }),
        );
        if (error !== null) {
          return yield* failAuth('reset_failed', error.message);
        }
        return yield* sessionFrom(data, '', 'Password reset succeeded but returned no session.');
      }),

    sendMagicLink: (email) =>
      Effect.gen(function* () {
        const { error } = yield* trySupabase('magic_link_failed', () =>
          auth.signInWithOtp({ email }),
        );
        if (error !== null) {
          return yield* failAuth('magic_link_failed', error.message);
        }
        return true as const;
      }),

    verifyMagicLink: (token) =>
      Effect.gen(function* () {
        const { data, error } = yield* trySupabase('magic_link_failed', () =>
          auth.verifyOtp({ token_hash: token, type: 'magiclink' }),
        );
        if (error !== null) {
          return yield* failAuth('magic_link_failed', error.message);
        }
        return yield* sessionFrom(data, '', 'Magic link verified but returned no session.');
      }),

    sendSmsCode: (phone) =>
      Effect.gen(function* () {
        const { error } = yield* trySupabase('sms_send_failed', () =>
          auth.signInWithOtp({ phone }),
        );
        if (error !== null) {
          return yield* failAuth('sms_send_failed', error.message);
        }
        return true as const;
      }),

    verifySmsCode: (phone, code) =>
      Effect.gen(function* () {
        const { data, error } = yield* trySupabase('sms_verify_failed', () =>
          auth.verifyOtp({ phone, token: code, type: 'sms' }),
        );
        if (error !== null) {
          return yield* failAuth('sms_verify_failed', error.message);
        }
        return yield* sessionFrom(data, '', 'SMS verified but returned no session.');
      }),

    getUser: (sessionToken) =>
      Effect.gen(function* () {
        const { data, error } = yield* trySupabase('get_user_failed', () =>
          auth.getUser(sessionToken),
        );
        if (error !== null) {
          return yield* failAuth('get_user_failed', error.message);
        }
        const user = normalizeAuthUser(data.user);
        if (user === null) {
          return yield* failAuth('no_user', 'No user for the given session token.');
        }
        return user;
      }),
  };
};

/** Map a GoTrue `{ user, session }` payload into an Effect session. */
const sessionFrom = (
  data: { readonly user: SupabaseUserLike | null; readonly session?: SupabaseSessionLike | null },
  fallbackEmail: string,
  noUserMessage: string,
): Effect.Effect<AuthSession, AuthError> => {
  const user =
    data.user === null
      ? null
      : {
          id: data.user.id,
          email:
            data.user.email === undefined || data.user.email === null
              ? fallbackEmail
              : data.user.email,
        };
  const token =
    data.session === undefined || data.session === null ? undefined : data.session.access_token;
  return toAuthSession(user, token, noUserMessage);
};

/** Construct the real GoTrue client (stateless server-side; no session persistence). */
const buildSupabaseAuthClient = (config: SupabaseAuthConfig): SupabaseAuthClientLike =>
  createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseAuthClientLike;

const trySupabase = <A>(code: string, run: () => Promise<A>): Effect.Effect<A, AuthError> =>
  Effect.tryPromise({
    try: run,
    catch: (caught) => authError(code, errorMessage(caught)),
  });

const errorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);
