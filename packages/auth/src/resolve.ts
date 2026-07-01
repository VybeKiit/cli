import {
  type EnvSource,
  isBackendUnconfigured,
  parseEnv,
  resolveEnvProvider,
} from '@vybekiit/core';
import { Context, Effect, Layer } from 'effect';
import {
  AuthConfigSchema,
  BetterAuthConfigSchema,
  CognitoConfigSchema,
  DataConfigSchema,
  MongoConfigSchema,
} from './config';
import { type BetterAuthInstance, createBetterAuthProvider } from './providers/better-auth/index';
import { type CognitoClientLike, createCognitoAuthProvider } from './providers/cognito/index';
import { createLocalAuthProvider } from './providers/local/index';
import type { AuthProvider } from './types';

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
  if (isBackendUnconfigured(env)) return createLocalAuthProvider();

  const cognito = (): AuthProvider =>
    createCognitoAuthProvider({
      config: parseEnv(CognitoConfigSchema, env),
      ...(injections.cognitoClient ? { client: injections.cognitoClient } : {}),
    });
  const injectedInstance = injections.betterAuthInstance
    ? { instance: injections.betterAuthInstance }
    : {};

  const { AUTH_PROVIDER } = parseEnv(AuthConfigSchema, env);
  if (AUTH_PROVIDER === 'local') return createLocalAuthProvider();
  if (AUTH_PROVIDER === 'cognito') return cognito();

  const { DATA_PROVIDER } = parseEnv(DataConfigSchema, env);
  return resolveEnvProvider(
    DATA_PROVIDER,
    {
      local: () => createLocalAuthProvider(),
      aws: () => cognito(),
      mongodb: (source) =>
        createBetterAuthProvider({
          config: parseEnv(BetterAuthConfigSchema, source),
          mongo: parseEnv(MongoConfigSchema, source),
          ...injectedInstance,
        }),
      supabase: (source) =>
        createBetterAuthProvider({
          config: parseEnv(BetterAuthConfigSchema, source),
          ...injectedInstance,
        }),
      neon: (source) =>
        createBetterAuthProvider({
          config: parseEnv(BetterAuthConfigSchema, source),
          ...injectedInstance,
        }),
      firebase: (source) =>
        createBetterAuthProvider({
          config: parseEnv(BetterAuthConfigSchema, source),
          ...injectedInstance,
        }),
      railway: (source) =>
        createBetterAuthProvider({
          config: parseEnv(BetterAuthConfigSchema, source),
          ...injectedInstance,
        }),
    },
    env,
    'supabase',
  );
}

/** The auth provider as an injectable service — composition roots `Effect.provide` it (ADR-0023 DI). */
export class Auth extends Context.Tag('@vybekiit/auth/Auth')<Auth, AuthProvider>() {}

/**
 * `Live` layer building {@link Auth} from the environment. Wraps the existing
 * {@link resolveAuthProvider} factory, so config still fails loud when the layer is
 * built at a composition root.
 */
export function makeAuthLive(
  env: EnvSource = process.env,
  injections: ResolveAuthInjections = {},
): Layer.Layer<Auth> {
  return Layer.effect(
    Auth,
    Effect.sync(() => resolveAuthProvider(env, injections)),
  );
}
