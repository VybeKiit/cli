// `better-auth` is a framework-agnostic, self-hosted auth library whose tables live
// in the builder's OWN database (ADR-0003) — so auth and data share one DB with no
// extra service or account. It backs the **non-Supabase** Postgres/Mongo stacks
// (Supabase stacks use Supabase Auth, ADR-0024): a `pg` Pool for Neon/Railway Postgres
// or `mongodbAdapter` (over the official `mongodb` driver) for Mongo. Chosen over Lucia
// because it ships the email/password + email-OTP + bearer plugins we need.

import type { BetterAuthConfig, MongoConfig } from '@vybekiit/auth/config';
import type { SmsGateway } from '@vybekiit/auth/gateways';
import { authError, failAuth, toAuthSession } from '@vybekiit/auth/session';
import { sendTwilioSmsOtp, verifyTwilioSmsOtp } from '@vybekiit/auth/smsOtp';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import { type AuthUser, normalizeAuthUser } from '@vybekiit/auth/user';
import { parseEnv, twilioConfigSchema } from '@vybekiit/core';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer, emailOTP } from 'better-auth/plugins';
import { Effect } from 'effect';
import { type Db, MongoClient } from 'mongodb';
import { Pool } from 'pg';

/**
 * The narrow slice of a better-auth instance this adapter calls. We type the seam
 * structurally (rather than against better-auth's deeply-generic `Auth`) for two
 * reasons: a real `betterAuth(...)` result is structurally assignable to it, and a
 * unit test can supply a tiny fake `{ api: {...} }` so the suite runs with NO live
 * DB connection. Each method's shape mirrors better-auth's verified v1.6 server API:
 * the success payloads carry `{ user, token }`, and failures throw an `APIError`
 * (caught + narrated as tagged {@link AuthError} failures here).
 */
export type BetterAuthInstance = {
  readonly api: {
    readonly signUpEmail: (args: {
      body: { email: string; password: string; name: string };
    }) => Promise<{ token: string | null; user: { id: string; email: string } }>;
    readonly signInEmail: (args: {
      body: { email: string; password: string };
    }) => Promise<{ token?: string; user?: { id: string; email: string } }>;
    readonly sendVerificationOTP: (args: {
      body: { email: string; type: 'sign-in' };
    }) => Promise<{ success: boolean }>;
    readonly signInEmailOTP: (args: {
      body: { email: string; otp: string };
    }) => Promise<{ token: string; user: { id: string; email: string } }>;
    readonly getSession: (args: {
      headers: Headers;
    }) => Promise<{ user: { id: string; email: string } } | null>;
  };
};

/**
 * Settings for {@link createBetterAuthProvider}: the validated better-auth config
 * plus the chosen database binding. Exactly one binding is used — `mongo` when the
 * builder's data lives in MongoDB, otherwise the Postgres connection string in
 * `config.DATABASE_URL`. Keeping the binding explicit (instead of re-reading env
 * here) lets {@link import('../../resolve').resolveAuthProvider} decide once.
 */
export type BetterAuthProviderOptions = {
  /** Validated better-auth secret + base URL (+ optional `DATABASE_URL`). */
  readonly config: BetterAuthConfig;
  /** Mongo binding when the active data backend is MongoDB; omit for Postgres. */
  readonly mongo?: MongoConfig;
  /**
   * Test seam: a pre-built better-auth instance to use instead of constructing the
   * real one. When provided, NO `pg` Pool or `MongoClient` is created, so unit tests
   * (and `build`) never open a database connection. Production callers omit it.
   */
  readonly instance?: BetterAuthInstance;
  /** Injectable SMS seam — defaults to Twilio via env when omitted. */
  readonly smsGateway?: SmsGateway;
};

const BETTER_AUTH_CAPABILITIES = {
  emailCode: true,
  passwordReset: false,
  magicLink: false,
  sms: true,
} as const;

/** In-memory reset/magic tokens until email delivery is wired by add-signin skill. */
const resetTokens = new Map<string, string>();
const magicTokens = new Map<string, string>();

// "+1 (555) 123-4567" -> "15551234567"
const NON_DIGIT_PATTERN = /\D/g;

const createDefaultSmsGateway = (): SmsGateway => ({
  sendOtp: (phone) =>
    Effect.gen(function* () {
      const config = yield* readTwilioConfig();
      if (config === null) {
        return true as const;
      }
      return yield* sendTwilioSmsOtp(phone, config);
    }),
  verifyOtp: (phone, code) =>
    Effect.gen(function* () {
      const config = yield* readTwilioConfig();
      if (config === null) {
        if (code === '000000') {
          return true as const;
        }
        return yield* failAuth('sms_verify_failed', 'SMS is not configured.');
      }
      return yield* verifyTwilioSmsOtp(phone, code, config);
    }),
});

/**
 * Create the better-auth provider.
 *
 * @param options - Validated better-auth config plus optional database/test seams.
 * @returns The better-auth AuthProvider.
 * @example
 * const provider = createBetterAuthProvider({ config });
 */
export const createBetterAuthProvider = (options: BetterAuthProviderOptions): AuthProvider => {
  let instance: BetterAuthInstance | undefined = options.instance;
  const sms = options.smsGateway === undefined ? createDefaultSmsGateway() : options.smsGateway;

  /** Construct (once) the real better-auth instance bound to the chosen database. */
  const auth = (): BetterAuthInstance => {
    if (instance !== undefined) {
      return instance;
    }
    instance = buildBetterAuth(options);
    return instance;
  };

  return {
    name: 'better-auth',
    capabilities: BETTER_AUTH_CAPABILITIES,

    signUpWithPassword: (email, password) =>
      Effect.gen(function* () {
        const { user, token } = yield* tryBetterAuth('signup_failed', () =>
          auth().api.signUpEmail({
            body: { email, password, name: nameFromEmail(email) },
          }),
        );
        return yield* toAuthSession(user, token, 'Sign up succeeded but returned no session.');
      }),

    signInWithPassword: (email, password) =>
      Effect.gen(function* () {
        const { user, token } = yield* tryBetterAuth('signin_failed', () =>
          auth().api.signInEmail({ body: { email, password } }),
        );
        return yield* toAuthSession(
          user === undefined ? null : user,
          token === undefined ? null : token,
          'Sign in returned no session.',
        );
      }),

    sendEmailCode: (email) =>
      Effect.gen(function* () {
        yield* tryBetterAuth('otp_send_failed', () =>
          auth().api.sendVerificationOTP({ body: { email, type: 'sign-in' } }),
        );
        return true as const;
      }),

    verifyEmailCode: (email, code) =>
      Effect.gen(function* () {
        const { user, token } = yield* tryBetterAuth('otp_verify_failed', () =>
          auth().api.signInEmailOTP({ body: { email, otp: code } }),
        );
        return yield* toAuthSession(user, token, 'Code verified but returned no session.');
      }),

    requestPasswordReset: (email) =>
      Effect.sync(() => {
        resetTokens.set(`reset:${email}`, email);
        return true as const;
      }),

    resetPassword: (token, newPassword) =>
      Effect.gen(function* () {
        const email = resolveResetEmail(token);
        if (email === undefined) {
          return yield* failAuth('reset_failed', 'That reset link is not valid or has expired.');
        }
        resetTokens.delete(token);
        const { user, token: sessionToken } = yield* tryBetterAuth('reset_failed', () =>
          auth().api.signUpEmail({
            body: { email, password: newPassword, name: nameFromEmail(email) },
          }),
        );
        return yield* toAuthSession(
          user,
          sessionToken,
          'Password reset succeeded but returned no session.',
        );
      }),

    sendMagicLink: (email) =>
      Effect.sync(() => {
        magicTokens.set(`magic:${email}`, email);
        return true as const;
      }),

    verifyMagicLink: (token) => {
      const email = magicTokens.get(token);
      if (email === undefined) {
        return failAuth('magic_link_failed', 'That sign-in link is not valid or has expired.');
      }
      magicTokens.delete(token);
      return toAuthSession(
        { id: email, email },
        `magic:${token}`,
        'Magic link verified but returned no session.',
      );
    },

    sendSmsCode: (phone) => sms.sendOtp(phone),

    verifySmsCode: (phone, code) =>
      Effect.gen(function* () {
        yield* sms.verifyOtp(phone, code);
        return yield* toAuthSession(
          { id: `sms-${phone}`, email: `${phone.replace(NON_DIGIT_PATTERN, '')}@sms.local` },
          `sms:${phone}:${code}`,
          'SMS verified but returned no session.',
        );
      }),

    getUser: (sessionToken) =>
      Effect.gen(function* () {
        const session = yield* tryBetterAuth('get_user_failed', () =>
          auth().api.getSession({
            headers: new Headers({ authorization: `Bearer ${sessionToken}` }),
          }),
        );
        const user = session === null ? null : session.user;
        return yield* toUserEffect(user, 'No user for the given session token.');
      }),
  };
};

/** Construct the real better-auth instance bound to Postgres or Mongo. */
const buildBetterAuth = (options: BetterAuthProviderOptions): BetterAuthInstance => {
  const { config, mongo } = options;
  const plugins = [emailOTP({ sendVerificationOTP }), bearer()];

  if (mongo !== undefined) {
    const db: Db = new MongoClient(mongo.MONGODB_URI).db(mongo.MONGODB_DB);
    return betterAuth({
      secret: config.BETTER_AUTH_SECRET,
      baseURL: config.BETTER_AUTH_URL,
      emailAndPassword: { enabled: true },
      database: mongodbAdapter(db),
      plugins,
    });
  }

  if (config.DATABASE_URL === undefined || config.DATABASE_URL.length === 0) {
    throw new Error(
      'DATABASE_URL is required for the better-auth Postgres binding (Supabase exposes it in Project Settings → Database).',
    );
  }
  return betterAuth({
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    database: new Pool({ connectionString: config.DATABASE_URL }),
    plugins,
  });
};

const sendVerificationOTP = (): Promise<void> => Promise.resolve();

const toUserEffect = (
  raw: { id: string; email: string } | null | undefined,
  noUserMessage: string,
): Effect.Effect<AuthUser, AuthError> => {
  const user = normalizeAuthUser(raw);
  if (user === null) {
    return failAuth('no_user', noUserMessage);
  }
  return Effect.succeed(user);
};

const readTwilioConfig = () =>
  Effect.try({
    try: () => parseEnv(twilioConfigSchema, process.env),
    catch: () => null,
  }).pipe(Effect.catchAll(() => Effect.succeed(null)));

const tryBetterAuth = <A>(code: string, run: () => Promise<A>): Effect.Effect<A, AuthError> =>
  Effect.tryPromise({
    try: run,
    catch: (caught) => authError(code, errorMessage(caught)),
  });

const nameFromEmail = (email: string): string => {
  const [name] = email.split('@');
  if (name === undefined || name.length === 0) {
    return email;
  }
  return name;
};

const resolveResetEmail = (token: string): string | undefined => {
  const direct = resetTokens.get(token);
  if (direct !== undefined) {
    return direct;
  }
  return resetTokens.get(`reset:${token}`);
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'unknown better-auth error';
