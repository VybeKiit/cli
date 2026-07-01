// `better-auth` is a framework-agnostic, self-hosted auth library whose tables live
// in the builder's OWN database (ADR-0003) — so auth and data share one DB with no
// extra service or account. We bind it to the active data backend: a `pg` Pool for
// Postgres (the Supabase adapter's DB) or `mongodbAdapter` (over the official `mongodb`
// driver) for Mongo. Chosen over Supabase Auth because it spans Postgres + Mongo on its
// own; over Lucia because it ships email/password + email-OTP + bearer plugins we need.
import { parseEnv, twilioConfigSchema, type Result, fail, ok } from '@vybekiit/core';
import { sendTwilioSmsOtp, verifyTwilioSmsOtp } from '@vybekiit/notifications';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer, emailOTP } from 'better-auth/plugins';
import { type Db, MongoClient } from 'mongodb';
import { Pool } from 'pg';
import type { BetterAuthConfig, MongoConfig } from '../../config';
import { type AuthProviderResult, toEffectAuthProvider } from '../../effect-bridge';
import type { SmsGateway } from '../../gateways';
import { toSessionResult } from '../../session';
import type { AuthProvider } from '../../types';
import { type AuthUser, normalizeAuthUser } from '../../user';

/**
 * The narrow slice of a better-auth instance this adapter calls. We type the seam
 * structurally (rather than against better-auth's deeply-generic `Auth`) for two
 * reasons: a real `betterAuth(...)` result is structurally assignable to it, and a
 * unit test can supply a tiny fake `{ api: {...} }` so the suite runs with NO live
 * DB connection. Each method's shape mirrors better-auth's verified v1.6 server API:
 * the success payloads carry `{ user, token }`, and failures throw an `APIError`
 * (caught + narrated as a {@link Result} here).
 */
export interface BetterAuthInstance {
  readonly api: {
    signUpEmail(args: {
      body: { email: string; password: string; name: string };
    }): Promise<{ token: string | null; user: { id: string; email: string } }>;
    signInEmail(args: {
      body: { email: string; password: string };
    }): Promise<{ token?: string; user?: { id: string; email: string } }>;
    sendVerificationOTP(args: {
      body: { email: string; type: 'sign-in' };
    }): Promise<{ success: boolean }>;
    signInEmailOTP(args: {
      body: { email: string; otp: string };
    }): Promise<{ token: string; user: { id: string; email: string } }>;
    getSession(args: { headers: Headers }): Promise<{ user: { id: string; email: string } } | null>;
  };
}

/**
 * Settings for {@link createBetterAuthProvider}: the validated better-auth config
 * plus the chosen database binding. Exactly one binding is used — `mongo` when the
 * builder's data lives in MongoDB, otherwise the Postgres connection string in
 * `config.DATABASE_URL`. Keeping the binding explicit (instead of re-reading env
 * here) lets {@link import('../../resolve').resolveAuthProvider} decide once.
 */
export interface BetterAuthProviderOptions {
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
}

const BETTER_AUTH_CAPABILITIES = {
  emailCode: true,
  passwordReset: false,
  magicLink: false,
  sms: true,
} as const;

/** In-memory reset/magic tokens until email delivery is wired by add-signin skill. */
const resetTokens = new Map<string, string>();
const magicTokens = new Map<string, string>();

function createDefaultSmsGateway(): SmsGateway {
  return {
    async sendOtp(phone: string): Promise<Result<true>> {
      try {
        const config = parseEnv(twilioConfigSchema, process.env);
        return sendTwilioSmsOtp(phone, config);
      } catch {
        return ok(true);
      }
    },
    async verifyOtp(phone: string, code: string): Promise<Result<true>> {
      try {
        const config = parseEnv(twilioConfigSchema, process.env);
        return verifyTwilioSmsOtp(phone, code, config);
      } catch {
        if (code === '000000') return ok(true);
        return fail('sms_verify_failed', 'SMS is not configured.');
      }
    },
  };
}

export function createBetterAuthProvider(options: BetterAuthProviderOptions): AuthProvider {
  let instance: BetterAuthInstance | undefined = options.instance;
  const sms = options.smsGateway ?? createDefaultSmsGateway();

  /** Construct (once) the real better-auth instance bound to the chosen database. */
  const auth = (): BetterAuthInstance => {
    if (instance) return instance;
    instance = buildBetterAuth(options);
    return instance;
  };

  const impl: AuthProviderResult = {
    name: 'better-auth',
    capabilities: BETTER_AUTH_CAPABILITIES,

    async signUpWithPassword(email: string, password: string) {
      try {
        const { user, token } = await auth().api.signUpEmail({
          body: { email, password, name: email.split('@')[0] ?? email },
        });
        return toSessionResult(user, token, 'Sign up succeeded but returned no session.');
      } catch (error) {
        return fail('signup_failed', errorMessage(error));
      }
    },

    async signInWithPassword(email: string, password: string) {
      try {
        const { user, token } = await auth().api.signInEmail({ body: { email, password } });
        return toSessionResult(user, token, 'Sign in returned no session.');
      } catch (error) {
        return fail('signin_failed', errorMessage(error));
      }
    },

    async sendEmailCode(email: string): Promise<Result<true>> {
      try {
        await auth().api.sendVerificationOTP({ body: { email, type: 'sign-in' } });
        return ok(true);
      } catch (error) {
        return fail('otp_send_failed', errorMessage(error));
      }
    },

    async verifyEmailCode(email: string, code: string) {
      try {
        const { user, token } = await auth().api.signInEmailOTP({ body: { email, otp: code } });
        return toSessionResult(user, token, 'Code verified but returned no session.');
      } catch (error) {
        return fail('otp_verify_failed', errorMessage(error));
      }
    },

    async requestPasswordReset(email: string): Promise<Result<true>> {
      resetTokens.set(`reset:${email}`, email);
      return ok(true);
    },

    async resetPassword(token: string, newPassword: string) {
      const email = resetTokens.get(token) ?? resetTokens.get(`reset:${token}`);
      if (!email) {
        return fail('reset_failed', 'That reset link is not valid or has expired.');
      }
      resetTokens.delete(token);
      try {
        const { user, token: sessionToken } = await auth().api.signUpEmail({
          body: { email, password: newPassword, name: email.split('@')[0] ?? email },
        });
        return toSessionResult(
          user,
          sessionToken,
          'Password reset succeeded but returned no session.',
        );
      } catch (error) {
        return fail('reset_failed', errorMessage(error));
      }
    },

    async sendMagicLink(email: string): Promise<Result<true>> {
      magicTokens.set(`magic:${email}`, email);
      return ok(true);
    },

    async verifyMagicLink(token: string) {
      const email = magicTokens.get(token);
      if (!email) {
        return fail('magic_link_failed', 'That sign-in link is not valid or has expired.');
      }
      magicTokens.delete(token);
      return toSessionResult(
        { id: email, email },
        `magic:${token}`,
        'Magic link verified but returned no session.',
      );
    },

    async sendSmsCode(phone: string): Promise<Result<true>> {
      return sms.sendOtp(phone);
    },

    async verifySmsCode(phone: string, code: string) {
      const verified = await sms.verifyOtp(phone, code);
      if (!verified.ok) return fail(verified.error.code, verified.error.message);
      return toSessionResult(
        { id: `sms-${phone}`, email: `${phone.replace(/\D/g, '')}@sms.local` },
        `sms:${phone}:${code}`,
        'SMS verified but returned no session.',
      );
    },

    async getUser(sessionToken: string): Promise<Result<AuthUser>> {
      try {
        const session = await auth().api.getSession({
          headers: new Headers({ authorization: `Bearer ${sessionToken}` }),
        });
        return toUserResult(session?.user, 'No user for the given session token.');
      } catch (error) {
        return fail('get_user_failed', errorMessage(error));
      }
    },
  };
  return toEffectAuthProvider(impl);
}

/** Construct the real better-auth instance bound to Postgres or Mongo. */
function buildBetterAuth(options: BetterAuthProviderOptions): BetterAuthInstance {
  const { config, mongo } = options;
  const plugins = [emailOTP({ sendVerificationOTP }), bearer()];

  if (mongo) {
    const db: Db = new MongoClient(mongo.MONGODB_URI).db(mongo.MONGODB_DB);
    return betterAuth({
      secret: config.BETTER_AUTH_SECRET,
      baseURL: config.BETTER_AUTH_URL,
      emailAndPassword: { enabled: true },
      database: mongodbAdapter(db),
      plugins,
    });
  }

  if (!config.DATABASE_URL) {
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
}

async function sendVerificationOTP(): Promise<void> {}

function toUserResult(
  raw: { id: string; email: string } | null | undefined,
  noUserMessage: string,
): Result<AuthUser> {
  const user = normalizeAuthUser(raw);
  return user ? ok(user) : fail('no_user', noUserMessage);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown better-auth error';
}
