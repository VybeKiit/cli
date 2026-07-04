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
  SupabaseAuthConfigSchema,
} from './config';
import { type BetterAuthInstance, createBetterAuthProvider } from './providers/betterAuth';
import { type CognitoClientLike, createCognitoAuthProvider } from './providers/cognito';
import { createLocalAuthProvider } from './providers/local';
import { createSupabaseAuthProvider, type SupabaseAuthClientLike } from './providers/supabase';
import type { AuthProvider } from './types';

/** Test seams for {@link resolveAuthProvider}; omit in production. */
export interface ResolveAuthInjections {
  readonly betterAuthInstance?: BetterAuthInstance;
  readonly cognitoClient?: CognitoClientLike;
  readonly supabaseAuthClient?: SupabaseAuthClientLike;
}

/**
 * Construct the configured auth provider from the environment — the single call site
 * the add-signin skill and server routes use, so they never name Supabase Auth,
 * better-auth, or Cognito (ADR-0003, ADR-0024).
 *
 * Resolution:
 * - Nothing configured → the local dev identity (ADR-0008).
 * - `AUTH_PROVIDER=local|cognito|supabase` → that adapter directly.
 * - `AUTH_PROVIDER=better-auth` → better-auth bound to Mongo (`DATA_PROVIDER=mongodb`)
 *   else Postgres.
 * - `AUTH_PROVIDER` unset → **auth follows data**: `supabase` → Supabase Auth (the
 *   default), `aws` → Cognito, `mongodb` → better-auth-on-Mongo, other Postgres
 *   (`neon`/`railway`/`firebase`) → better-auth, `local` → local.
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

  const supabaseAuth = (): AuthProvider =>
    createSupabaseAuthProvider({
      config: parseEnv(SupabaseAuthConfigSchema, env),
      ...(injections.supabaseAuthClient ? { client: injections.supabaseAuthClient } : {}),
    });
  const cognito = (): AuthProvider =>
    createCognitoAuthProvider({
      config: parseEnv(CognitoConfigSchema, env),
      ...(injections.cognitoClient ? { client: injections.cognitoClient } : {}),
    });
  const injectedInstance = injections.betterAuthInstance
    ? { instance: injections.betterAuthInstance }
    : {};
  const betterAuthPostgres = (source: EnvSource): AuthProvider =>
    createBetterAuthProvider({
      config: parseEnv(BetterAuthConfigSchema, source),
      ...injectedInstance,
    });
  const betterAuthMongo = (source: EnvSource): AuthProvider =>
    createBetterAuthProvider({
      config: parseEnv(BetterAuthConfigSchema, source),
      mongo: parseEnv(MongoConfigSchema, source),
      ...injectedInstance,
    });
  const betterAuth = (source: EnvSource): AuthProvider =>
    parseEnv(DataConfigSchema, source).DATA_PROVIDER === 'mongodb'
      ? betterAuthMongo(source)
      : betterAuthPostgres(source);

  const { AUTH_PROVIDER } = parseEnv(AuthConfigSchema, env);
  if (AUTH_PROVIDER === 'local') return createLocalAuthProvider();
  if (AUTH_PROVIDER === 'cognito') return cognito();
  if (AUTH_PROVIDER === 'supabase') return supabaseAuth();
  if (AUTH_PROVIDER === 'better-auth') return betterAuth(env);

  return resolveEnvProvider<AuthProvider>(
    parseEnv(DataConfigSchema, env).DATA_PROVIDER,
    {
      local: () => createLocalAuthProvider(),
      supabase: () => supabaseAuth(),
      aws: () => cognito(),
      mongodb: (source) => betterAuthMongo(source),
      neon: (source) => betterAuthPostgres(source),
      firebase: (source) => betterAuthPostgres(source),
      railway: (source) => betterAuthPostgres(source),
    },
    env,
    'supabase',
  );
}

/** The auth provider as an injectable service — composition roots `Effect.provide` it (ADR-0023 DI). */
export class Auth extends Context.Tag('@vybekiit/auth/Auth')<Auth, AuthProvider>() {}

/**
 * `Live` layer building {@link Auth} from the environment. Wraps {@link resolveAuthProvider},
 * so config still fails loud when the layer is built at a composition root.
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
