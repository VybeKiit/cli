import type { BetterAuthInstance } from '@vybekiit/auth/providers/betterAuth';
import type { SupabaseAuthClientLike } from '@vybekiit/auth/providers/supabase';
import { type ResolveAuthInjections, resolveAuthProvider } from '@vybekiit/auth/resolve';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

// Stub the Cognito client so resolving the cognito adapter never opens a real
// connection — construction must succeed offline and deterministically.
vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: class {},
}));

// Empty fake seams: resolve only *constructs* a provider (it never calls a method), so
// the surfaces can stay empty. They keep `pg`/Mongo/GoTrue from being dialed here.
const betterAuthInstance = { api: {} } as unknown as BetterAuthInstance;
const supabaseAuthClient = { auth: {} } as unknown as SupabaseAuthClientLike;

const supabaseEnv = { SUPABASE_URL: 'https://demo.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };
const betterAuthEnv = {
  DATA_PROVIDER: 'neon',
  BETTER_AUTH_SECRET: 'secret',
  DATABASE_URL: 'postgres://localhost/db',
};
const mongoEnv = {
  DATA_PROVIDER: 'mongodb',
  BETTER_AUTH_SECRET: 'secret',
  MONGODB_URI: 'mongodb://localhost:27017',
  MONGODB_DB: 'app',
};
const cognitoEnv = {
  COGNITO_USER_POOL_ID: 'pool',
  COGNITO_CLIENT_ID: 'client',
  AWS_REGION: 'us-east-1',
};

// matches a missing Supabase URL in parseEnv output: "SUPABASE_URL"
const SUPABASE_URL_PATTERN = /SUPABASE_URL/;
// matches a missing better-auth secret in parseEnv output: "BETTER_AUTH_SECRET"
const BETTER_AUTH_SECRET_PATTERN = /BETTER_AUTH_SECRET/;
// matches a missing Cognito pool id in parseEnv output: "COGNITO_USER_POOL_ID"
const COGNITO_USER_POOL_ID_PATTERN = /COGNITO_USER_POOL_ID/;

const resolveProvider = (
  env: Record<string, string | undefined>,
  injections: ResolveAuthInjections = {},
) => Effect.runSync(resolveAuthProvider(env, injections));

const resolveProviderError = (
  env: Record<string, string | undefined>,
  injections: ResolveAuthInjections = {},
) => Effect.runSync(Effect.flip(resolveAuthProvider(env, injections)));

describe('resolveAuthProvider', () => {
  it('falls back to the local adapter when nothing is configured', () => {
    expect(resolveProvider({}).name).toBe('local');
  });

  it('resolves the local adapter for an explicit AUTH_PROVIDER=local', () => {
    expect(resolveProvider({ AUTH_PROVIDER: 'local' }).name).toBe('local');
  });

  it('pairs local auth with an explicit DATA_PROVIDER=local (no secret required)', () => {
    expect(resolveProvider({ DATA_PROVIDER: 'local' }).name).toBe('local');
  });

  it('defaults to Supabase Auth for the default Supabase stack', () => {
    expect(resolveProvider(supabaseEnv, { supabaseAuthClient }).name).toBe('supabase');
  });
});

describe('resolveAuthProvider configured providers', () => {
  it('uses Supabase Auth for an explicit AUTH_PROVIDER=supabase', () => {
    const provider = resolveProvider(
      { ...supabaseEnv, AUTH_PROVIDER: 'supabase' },
      { supabaseAuthClient },
    );
    expect(provider.name).toBe('supabase');
  });

  it('uses better-auth for a non-Supabase Postgres (DATA_PROVIDER=neon)', () => {
    expect(resolveProvider(betterAuthEnv, { betterAuthInstance }).name).toBe('better-auth');
  });

  it('uses better-auth for DATA_PROVIDER=mongodb', () => {
    expect(resolveProvider(mongoEnv, { betterAuthInstance }).name).toBe('better-auth');
  });

  it('honors an explicit AUTH_PROVIDER=better-auth', () => {
    const provider = resolveProvider(
      { AUTH_PROVIDER: 'better-auth', BETTER_AUTH_SECRET: 'secret', DATABASE_URL: 'postgres://x' },
      { betterAuthInstance },
    );
    expect(provider.name).toBe('better-auth');
  });

  it('auto-routes DATA_PROVIDER=aws to cognito', () => {
    expect(resolveProvider({ ...cognitoEnv, DATA_PROVIDER: 'aws' }).name).toBe('cognito');
  });

  it('uses cognito when AUTH_PROVIDER=cognito regardless of data', () => {
    expect(resolveProvider({ ...cognitoEnv, AUTH_PROVIDER: 'cognito' }).name).toBe('cognito');
  });
});

describe('resolveAuthProvider config failures', () => {
  it('fails loud when Supabase Auth is selected without its keys', () => {
    expect(resolveProviderError({ AUTH_PROVIDER: 'supabase' }).message).toMatch(
      SUPABASE_URL_PATTERN,
    );
  });

  it('fails loud when better-auth is selected without its secret', () => {
    expect(
      resolveProviderError({ DATA_PROVIDER: 'neon', DATABASE_URL: 'postgres://x' }).message,
    ).toMatch(BETTER_AUTH_SECRET_PATTERN);
  });

  it('fails loud when cognito is selected without its pool id', () => {
    expect(
      resolveProviderError({
        AUTH_PROVIDER: 'cognito',
        AWS_REGION: 'us-east-1',
        COGNITO_CLIENT_ID: 'c',
      }).message,
    ).toMatch(COGNITO_USER_POOL_ID_PATTERN);
  });
});
