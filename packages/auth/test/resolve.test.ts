import { describe, expect, it, vi } from 'vitest';
import type { BetterAuthInstance } from '../src/providers/better-auth/index';
import { resolveAuthProvider } from '../src/resolve';

// Stub the Cognito client so resolving the cognito adapter never opens a real
// connection — construction must succeed offline and deterministically.
vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: class {},
}));

// An empty fake better-auth instance: resolve only constructs the provider here (it
// never calls a method), so the `api` surface can stay empty. The instance is what
// keeps `pg`/Mongo from being dialed during resolution.
const betterAuthInstance = { api: {} } as unknown as BetterAuthInstance;

const betterAuthEnv = { BETTER_AUTH_SECRET: 'secret', DATABASE_URL: 'postgres://localhost/db' };
const mongoEnv = {
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

  it('uses better-auth (not local) once its secret is present', () => {
    const provider = resolveAuthProvider(betterAuthEnv, { betterAuthInstance });
    expect(provider.name).toBe('better-auth');
  });

  it('defaults to better-auth when DATA_PROVIDER is supabase', () => {
    const provider = resolveAuthProvider(betterAuthEnv, { betterAuthInstance });
    expect(provider.name).toBe('better-auth');
  });

  it('uses better-auth for DATA_PROVIDER=mongodb', () => {
    const provider = resolveAuthProvider(
      { ...mongoEnv, DATA_PROVIDER: 'mongodb' },
      { betterAuthInstance },
    );
    expect(provider.name).toBe('better-auth');
  });

  it('auto-routes DATA_PROVIDER=aws to cognito', () => {
    const provider = resolveAuthProvider({ ...cognitoEnv, DATA_PROVIDER: 'aws' });
    expect(provider.name).toBe('cognito');
  });

  it('uses cognito when AUTH_PROVIDER=cognito regardless of data', () => {
    const provider = resolveAuthProvider({ ...cognitoEnv, AUTH_PROVIDER: 'cognito' });
    expect(provider.name).toBe('cognito');
  });

  it('fails loud when better-auth is selected without its secret', () => {
    expect(() => resolveAuthProvider({ DATABASE_URL: 'postgres://x' })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
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
