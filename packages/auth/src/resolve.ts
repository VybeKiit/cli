import { type EnvSource, isBackendUnconfigured, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  AuthConfigSchema,
  BetterAuthConfigSchema,
  CognitoConfigSchema,
  type DataConfig,
  DataConfigSchema,
  MongoConfigSchema,
  SupabaseAuthConfigSchema,
} from './config';
import { type BetterAuthInstance, createBetterAuthProvider } from './providers/betterAuth';
import { type CognitoClientLike, createCognitoAuthProvider } from './providers/cognito';
import { createLocalAuthProvider } from './providers/local';
import { createSupabaseAuthProvider, type SupabaseAuthClientLike } from './providers/supabase';
import { AuthError, type AuthProvider, type AuthProviderName } from './types';

/** Test seams for {@link resolveAuthProvider}; omit in production. */
export type ResolveAuthInjections = {
  readonly betterAuthInstance?: BetterAuthInstance;
  readonly cognitoClient?: CognitoClientLike;
  readonly supabaseAuthClient?: SupabaseAuthClientLike;
};

type AuthProviderFactory = (source: EnvSource) => Effect.Effect<AuthProvider, AuthError>;

type DataProviderName = DataConfig['DATA_PROVIDER'];

const authErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseAuthConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, AuthError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new AuthError({
        code: 'auth_config_invalid',
        message: authErrorMessage(caught),
      }),
  });

const createProviderNotRegisteredError = (kind: string, provider: string): AuthError =>
  new AuthError({
    code: 'auth_provider_unsupported',
    message: `No auth adapter is registered for ${kind} provider ${provider}.`,
  });

const findAuthProviderFactory = (
  provider: string,
  factories: Readonly<Record<string, AuthProviderFactory | undefined>>,
  kind: string,
): Effect.Effect<AuthProviderFactory, AuthError> => {
  const createProvider = factories[provider];

  if (createProvider === undefined) {
    return Effect.fail(createProviderNotRegisteredError(kind, provider));
  }

  return Effect.succeed(createProvider);
};

const injectedBetterAuthOptions = (
  injections: ResolveAuthInjections,
): { readonly instance?: BetterAuthInstance } =>
  injections.betterAuthInstance === undefined ? {} : { instance: injections.betterAuthInstance };

const createSupabaseFactory =
  (injections: ResolveAuthInjections): AuthProviderFactory =>
  (source) =>
    parseAuthConfigSlice(SupabaseAuthConfigSchema, source).pipe(
      Effect.map((config) =>
        createSupabaseAuthProvider({
          config,
          ...(injections.supabaseAuthClient === undefined
            ? {}
            : { client: injections.supabaseAuthClient }),
        }),
      ),
    );

const createCognitoFactory =
  (injections: ResolveAuthInjections): AuthProviderFactory =>
  (source) =>
    parseAuthConfigSlice(CognitoConfigSchema, source).pipe(
      Effect.map((config) =>
        createCognitoAuthProvider({
          config,
          ...(injections.cognitoClient === undefined ? {} : { client: injections.cognitoClient }),
        }),
      ),
    );

const createBetterAuthPostgresFactory = (
  injections: ResolveAuthInjections,
): AuthProviderFactory => {
  const betterAuthOptions = injectedBetterAuthOptions(injections);

  return (source) =>
    parseAuthConfigSlice(BetterAuthConfigSchema, source).pipe(
      Effect.map((config) =>
        createBetterAuthProvider({
          config,
          ...betterAuthOptions,
        }),
      ),
    );
};

const createBetterAuthMongoFactory = (injections: ResolveAuthInjections): AuthProviderFactory => {
  const betterAuthOptions = injectedBetterAuthOptions(injections);

  return (source) =>
    Effect.all({
      config: parseAuthConfigSlice(BetterAuthConfigSchema, source),
      mongo: parseAuthConfigSlice(MongoConfigSchema, source),
    }).pipe(
      Effect.map(({ config, mongo }) =>
        createBetterAuthProvider({
          config,
          mongo,
          ...betterAuthOptions,
        }),
      ),
    );
};

const createBetterAuthFactory =
  (
    betterAuthPostgres: AuthProviderFactory,
    betterAuthMongo: AuthProviderFactory,
  ): AuthProviderFactory =>
  (source) =>
    parseAuthConfigSlice(DataConfigSchema, source).pipe(
      Effect.flatMap(({ DATA_PROVIDER }) =>
        DATA_PROVIDER === 'mongodb' ? betterAuthMongo(source) : betterAuthPostgres(source),
      ),
    );

const buildAuthProviderFactories = (
  injections: ResolveAuthInjections,
): {
  readonly explicit: Record<AuthProviderName, AuthProviderFactory>;
  readonly data: Record<DataProviderName, AuthProviderFactory>;
} => {
  const supabaseAuth = createSupabaseFactory(injections);
  const cognito = createCognitoFactory(injections);
  const betterAuthPostgres = createBetterAuthPostgresFactory(injections);
  const betterAuthMongo = createBetterAuthMongoFactory(injections);
  const betterAuth = createBetterAuthFactory(betterAuthPostgres, betterAuthMongo);

  return {
    explicit: {
      local: () => Effect.succeed(createLocalAuthProvider()),
      cognito,
      supabase: supabaseAuth,
      'better-auth': betterAuth,
    },
    data: {
      local: () => Effect.succeed(createLocalAuthProvider()),
      supabase: supabaseAuth,
      aws: cognito,
      mongodb: betterAuthMongo,
      neon: betterAuthPostgres,
      firebase: betterAuthPostgres,
      railway: betterAuthPostgres,
    },
  };
};

const resolveAuthProviderFromData = (
  env: EnvSource,
  factories: Record<DataProviderName, AuthProviderFactory>,
): Effect.Effect<AuthProvider, AuthError> =>
  parseAuthConfigSlice(DataConfigSchema, env).pipe(
    Effect.flatMap(({ DATA_PROVIDER }) =>
      findAuthProviderFactory(DATA_PROVIDER, factories, 'data').pipe(
        Effect.flatMap((createProvider) => createProvider(env)),
      ),
    ),
  );

/**
 * Resolve the configured auth provider without throwing across the Effect boundary.
 *
 * @param env - Environment source to parse; defaults to `process.env`.
 * @param injections - Test seams for provider clients; omit in production.
 * @returns An Effect that succeeds with the selected auth provider or fails with AuthError.
 * @example
 * const provider = await Effect.runPromise(resolveAuthProvider({ AUTH_PROVIDER: 'local' }));
 */
export const resolveAuthProvider = (
  env: EnvSource = process.env,
  injections: ResolveAuthInjections = {},
): Effect.Effect<AuthProvider, AuthError> => {
  if (isBackendUnconfigured(env)) {
    return Effect.succeed(createLocalAuthProvider());
  }

  const factories = buildAuthProviderFactories(injections);

  return parseAuthConfigSlice(AuthConfigSchema, env).pipe(
    Effect.flatMap(({ AUTH_PROVIDER }) => {
      if (AUTH_PROVIDER === undefined) {
        return resolveAuthProviderFromData(env, factories.data);
      }

      return findAuthProviderFactory(AUTH_PROVIDER, factories.explicit, 'auth').pipe(
        Effect.flatMap((createProvider) => createProvider(env)),
      );
    }),
  );
};

/** The auth provider as an injectable service — composition roots `Effect.provide` it (ADR-0023 DI). */
export class Auth extends Context.Tag('@vybekiit/auth/Auth')<Auth, AuthProvider>() {}

/**
 * Build the live Auth Layer from environment config.
 *
 * @param env - Environment source to parse; defaults to `process.env`.
 * @param injections - Test seams for provider clients; omit in production.
 * @returns A Layer that provides Auth or fails with AuthError during construction.
 * @example
 * const runtime = ManagedRuntime.make(makeAuthLive({ AUTH_PROVIDER: 'local' }));
 */
export const makeAuthLive = (
  env: EnvSource = process.env,
  injections: ResolveAuthInjections = {},
): Layer.Layer<Auth, AuthError> => Layer.effect(Auth, resolveAuthProvider(env, injections));
