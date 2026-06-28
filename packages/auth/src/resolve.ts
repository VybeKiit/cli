import {
  authConfigSchema,
  betterAuthConfigSchema,
  cognitoConfigSchema,
  dataConfigSchema,
  mongoConfigSchema,
  parseEnv,
} from '@vybekiit/core';
import { type BetterAuthInstance, createBetterAuthProvider } from './providers/better-auth';
import { type CognitoClientLike, createCognitoAuthProvider } from './providers/cognito';
import { createLocalAuthProvider } from './providers/local';
import type { AuthProvider } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/**
 * The keys whose presence means a real auth or data backend is being configured —
 * any one of them means the builder intends a real backend, so the local fallback
 * stands down. `BETTER_AUTH_SECRET`/`DATABASE_URL` anchor better-auth, `COGNITO_*`
 * anchors Cognito, and the data anchors mirror `@vybekiit/db`'s resolver so auth
 * follows data: a configured database implies real auth, not the dev identity.
 */
const CONFIGURED_KEYS = [
  'BETTER_AUTH_SECRET',
  'DATABASE_URL',
  'COGNITO_USER_POOL_ID',
  'SUPABASE_URL',
  'MONGODB_URI',
  'AWS_REGION',
] as const;

/**
 * True when nothing selects or configures an auth/data backend — no `AUTH_PROVIDER`,
 * no `DATA_PROVIDER`, and none of the {@link CONFIGURED_KEYS}. Only this empty case
 * is filled by the local dev identity (ADR-0008); any explicit provider or backend
 * key resolves normally and fails loud on its own missing keys. Checked against raw
 * env *before* {@link parseEnv}, whose `.default(...)`s would otherwise mask it.
 */
function isAuthUnconfigured(env: EnvSource): boolean {
  if (env.AUTH_PROVIDER || env.DATA_PROVIDER) return false;
  return CONFIGURED_KEYS.every((key) => !env[key]);
}

/**
 * Test seams passed straight through to the adapters so resolving never opens a real
 * connection. `betterAuthInstance` injects a fake better-auth instance (no `pg`/Mongo
 * dial); `cognitoClient` injects a fake Cognito client (no network). Production
 * callers omit both — consistent with how the deploy/email resolvers accept injected
 * runners/fetch.
 */
export interface ResolveAuthInjections {
  readonly betterAuthInstance?: BetterAuthInstance;
  readonly cognitoClient?: CognitoClientLike;
}

/**
 * Construct the configured auth provider from the environment — the single call site
 * the add-signin skill and server routes use, so they never name better-auth or
 * Cognito (ADR-0003).
 *
 * Resolution order (auth follows data):
 * - Nothing configured (no `AUTH_PROVIDER`/`DATA_PROVIDER`/backend keys) → the local
 *   dev identity, so a fresh scaffold signs in offline with no secrets (ADR-0008).
 * - `AUTH_PROVIDER=local` → the local dev identity explicitly.
 * - `AUTH_PROVIDER=cognito` → Cognito directly.
 * - `AUTH_PROVIDER=better-auth` (default) → branch on `DATA_PROVIDER`:
 *   - `aws` → **Cognito**. DynamoDB has no better-auth adapter, so AWS-data apps use
 *     Cognito behind the same interface; the builder never hears the name (ADR-0003).
 *   - `mongodb` → better-auth bound to the Mongo database.
 *   - default (`supabase`/postgres) → better-auth bound to Postgres via `DATABASE_URL`.
 *
 * @param env - environment source (defaults to `process.env`)
 * @param injections - test seams; omit in production
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}).
 */
export function resolveAuthProvider(
  env: EnvSource = process.env,
  injections: ResolveAuthInjections = {},
): AuthProvider {
  if (isAuthUnconfigured(env)) return createLocalAuthProvider();

  // The optional test seams are spread conditionally so an omitted injection stays
  // *absent* rather than an explicit `undefined` (the repo runs exactOptionalPropertyTypes).
  const cognito = (): AuthProvider =>
    createCognitoAuthProvider({
      config: parseEnv(cognitoConfigSchema, env),
      ...(injections.cognitoClient ? { client: injections.cognitoClient } : {}),
    });
  const injectedInstance = injections.betterAuthInstance
    ? { instance: injections.betterAuthInstance }
    : {};

  const { AUTH_PROVIDER } = parseEnv(authConfigSchema, env);
  if (AUTH_PROVIDER === 'local') return createLocalAuthProvider();
  if (AUTH_PROVIDER === 'cognito') return cognito();

  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  switch (DATA_PROVIDER) {
    // Auth follows data: explicit local data pairs with the local dev identity, so
    // forcing `DATA_PROVIDER=local` doesn't then demand a real auth secret (ADR-0008).
    case 'local':
      return createLocalAuthProvider();
    // DynamoDB has no better-auth adapter, so AWS-data apps use Cognito behind the
    // same interface; the builder never hears the name (ADR-0003).
    case 'aws':
      return cognito();
    case 'mongodb':
      return createBetterAuthProvider({
        config: parseEnv(betterAuthConfigSchema, env),
        mongo: parseEnv(mongoConfigSchema, env),
        ...injectedInstance,
      });
    default:
      return createBetterAuthProvider({
        config: parseEnv(betterAuthConfigSchema, env),
        ...injectedInstance,
      });
  }
}
