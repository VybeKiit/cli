// `better-auth` is a framework-agnostic, self-hosted auth library whose tables live
// in the builder's OWN database (ADR-0003) — so auth and data share one DB with no
// extra service or account. We bind it to the active data backend: a `pg` Pool for
// Postgres (the Supabase adapter's DB) or `mongodbAdapter` (over the official `mongodb`
// driver) for Mongo. Chosen over Supabase Auth because it spans Postgres + Mongo on its
// own; over Lucia because it ships email/password + email-OTP + bearer plugins we need.
import { type BetterAuthConfig, type MongoConfig, type Result, fail, ok } from '@vybekiit/core';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer, emailOTP } from 'better-auth/plugins';
import { type Db, MongoClient } from 'mongodb';
import { Pool } from 'pg';
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
    getSession(args: {
      headers: Headers;
    }): Promise<{ user: { id: string; email: string } } | null>;
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
}

/**
 * Build the DB-bound better-auth {@link AuthProvider} — VybeKiit's default auth
 * backend (ADR-0003).
 *
 * Construction is **lazy**: the real {@link BetterAuthInstance} (and the underlying
 * `pg` Pool / `MongoClient`) is created only on first method call, and only when no
 * `instance` was injected. This keeps the factory synchronous, lets tests inject a
 * fake with no live DB, and means a misconfigured `DATABASE_URL` surfaces at first
 * use rather than at import time.
 *
 * Database binding: `options.mongo` selects the `mongodbAdapter`; otherwise the
 * Postgres connection string in `config.DATABASE_URL` is opened via a `pg` Pool
 * (better-auth wraps it in its Kysely Postgres dialect). The `emailOTP` plugin backs
 * `sendEmailCode`/`verifyEmailCode`; the `bearer` plugin lets `getUser` resolve a
 * session from an `Authorization: Bearer <token>` header server-side.
 *
 * Every method maps better-auth's `{ user, token }` success payload through
 * {@link normalizeAuthUser} into a {@link Result}, and converts a thrown `APIError`
 * (or any error) into a `fail(...)` with the interface's stable codes — no exception
 * crosses the boundary.
 */
export function createBetterAuthProvider(options: BetterAuthProviderOptions): AuthProvider {
  let instance: BetterAuthInstance | undefined = options.instance;

  /** Construct (once) the real better-auth instance bound to the chosen database. */
  const auth = (): BetterAuthInstance => {
    if (instance) return instance;
    instance = buildBetterAuth(options);
    return instance;
  };

  return {
    name: 'better-auth',

    async signUpWithPassword(email: string, password: string): Promise<Result<AuthUser>> {
      try {
        // better-auth requires a `name`; we have none at sign-up, so default to the
        // email's local part — a sensible display name the builder can edit later.
        const { user } = await auth().api.signUpEmail({
          body: { email, password, name: email.split('@')[0] ?? email },
        });
        return toUserResult(user, 'Sign up succeeded but returned no user.');
      } catch (error) {
        return fail('signup_failed', errorMessage(error));
      }
    },

    async signInWithPassword(email: string, password: string): Promise<Result<AuthUser>> {
      try {
        const { user } = await auth().api.signInEmail({ body: { email, password } });
        return toUserResult(user, 'Sign in returned no user.');
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

    async verifyEmailCode(email: string, code: string): Promise<Result<AuthUser>> {
      try {
        const { user } = await auth().api.signInEmailOTP({ body: { email, otp: code } });
        return toUserResult(user, 'Code verified but returned no user.');
      } catch (error) {
        return fail('otp_verify_failed', errorMessage(error));
      }
    },

    async getUser(sessionToken: string): Promise<Result<AuthUser>> {
      try {
        // The `bearer` plugin resolves the session from this header server-side; the
        // token is the one returned by sign-in/sign-up above.
        const session = await auth().api.getSession({
          headers: new Headers({ authorization: `Bearer ${sessionToken}` }),
        });
        return toUserResult(session?.user, 'No user for the given session token.');
      } catch (error) {
        return fail('get_user_failed', errorMessage(error));
      }
    },
  };
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

/**
 * emailOTP's required delivery callback. Actually mailing the code is the
 * `add-signin` skill's job (it wires `@vybekiit/email` here when the builder asks),
 * so the default is a no-op rather than a hard dependency on a mail provider at
 * construction time — keeping this package free of an email-provider coupling.
 */
async function sendVerificationOTP(): Promise<void> {}

/** Map a provider user (possibly absent) to a {@link Result}, failing as `no_user`. */
function toUserResult(
  raw: { id: string; email: string } | null | undefined,
  noUserMessage: string,
): Result<AuthUser> {
  const user = normalizeAuthUser(raw);
  return user ? ok(user) : fail('no_user', noUserMessage);
}

/** Narrow an unknown caught value to a developer-facing message string. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown better-auth error';
}
