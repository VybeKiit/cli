import { describe, expect, it, vi } from 'vitest';
import type { BetterAuthInstance } from '../src/providers/betterAuth';
import type { SupabaseAuthClientLike } from '../src/providers/supabase';
import { resolveAuthProvider } from '../src/resolve';

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

describe('resolveAuthProvider', () => {
  it('falls back to the local adapter when nothing is configured', () => {
    expect(resolveAuthProvider({}).name).toBe('local');
  });

  it('resolves the local adapter for an explicit AUTH_PROVIDER=local', () => {
    expect(resolveAuthProvider({ AUTH_PROVIDER: 'local' }).name).toBe('local');
  });

  it('pairs local auth with an explicit DATA_PROVIDER=local (no secret required)', () => {
    expect(resolveAuthProvider({ DATA_PROVIDER: 'local' }).name).toBe('local');
  });

  it('defaults to Supabase Auth for the default Supabase stack', () => {
    expect(resolveAuthProvider(supabaseEnv, { supabaseAuthClient }).name).toBe('supabase');
  });

  it('uses Supabase Auth for an explicit AUTH_PROVIDER=supabase', () => {
    const provider = resolveAuthProvider(
      { ...supabaseEnv, AUTH_PROVIDER: 'supabase' },
      { supabaseAuthClient },
    );
    expect(provider.name).toBe('supabase');
  });

  it('uses better-auth for a non-Supabase Postgres (DATA_PROVIDER=neon)', () => {
    expect(resolveAuthProvider(betterAuthEnv, { betterAuthInstance }).name).toBe('better-auth');
  });

  it('uses better-auth for DATA_PROVIDER=mongodb', () => {
    expect(resolveAuthProvider(mongoEnv, { betterAuthInstance }).name).toBe('better-auth');
  });

  it('honors an explicit AUTH_PROVIDER=better-auth', () => {
    const provider = resolveAuthProvider(
      { AUTH_PROVIDER: 'better-auth', BETTER_AUTH_SECRET: 'secret', DATABASE_URL: 'postgres://x' },
      { betterAuthInstance },
    );
    expect(provider.name).toBe('better-auth');
  });

  it('auto-routes DATA_PROVIDER=aws to cognito', () => {
    expect(resolveAuthProvider({ ...cognitoEnv, DATA_PROVIDER: 'aws' }).name).toBe('cognito');
  });

  it('uses cognito when AUTH_PROVIDER=cognito regardless of data', () => {
    expect(resolveAuthProvider({ ...cognitoEnv, AUTH_PROVIDER: 'cognito' }).name).toBe('cognito');
  });

  it('fails loud when Supabase Auth is selected without its keys', () => {
    expect(() => resolveAuthProvider({ AUTH_PROVIDER: 'supabase' })).toThrow(/SUPABASE_URL/);
  });

  it('fails loud when better-auth is selected without its secret', () => {
    expect(() =>
      resolveAuthProvider({ DATA_PROVIDER: 'neon', DATABASE_URL: 'postgres://x' }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('fails loud when cognito is selected without its pool id', () => {
    expect(() =>
      resolveAuthProvider({
        AUTH_PROVIDER: 'cognito',
        AWS_REGION: 'us-east-1',
        COGNITO_CLIENT_ID: 'c',
      }),
    ).toThrow(/COGNITO_USER_POOL_ID/);
  });
});
