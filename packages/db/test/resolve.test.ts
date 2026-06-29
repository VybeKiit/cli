import { describe, expect, it, vi } from 'vitest';
import { resolveDataProvider, resolveStorageProvider } from '../src/resolve';

// Stub the native drivers so resolving the mongodb/aws adapters never opens a real
// connection — construction must succeed offline and deterministically.
vi.mock('mongodb', () => ({
  MongoClient: class {
    db() {
      return {};
    }
  },
}));
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({}) },
}));
vi.mock('@aws-sdk/client-s3', () => ({ S3Client: class {} }));

const supabaseEnv = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
};

describe('resolveDataProvider', () => {
  it('falls back to the local adapter when nothing is configured', () => {
    expect(resolveDataProvider({}).name).toBe('local');
  });

  it('resolves supabase when its keys are present (a real backend is intended)', () => {
    // A Supabase anchor key alone is enough to mean "real backend, not local".
    expect(resolveDataProvider(supabaseEnv).name).toBe('supabase');
  });

  it('resolves supabase for an explicit DATA_PROVIDER=supabase with its keys', () => {
    const provider = resolveDataProvider({ ...supabaseEnv, DATA_PROVIDER: 'supabase' });
    expect(provider.name).toBe('supabase');
  });

  it('resolves the local adapter for an explicit DATA_PROVIDER=local', () => {
    expect(resolveDataProvider({ DATA_PROVIDER: 'local' }).name).toBe('local');
  });

  it('constructs the mongodb adapter from its config', () => {
    const provider = resolveDataProvider({
      ...supabaseEnv,
      DATA_PROVIDER: 'mongodb',
      MONGODB_URI: 'mongodb+srv://x',
      MONGODB_DB: 'app',
    });
    expect(provider.name).toBe('mongodb');
  });

  it('constructs the aws adapter from its config', () => {
    const provider = resolveDataProvider({
      ...supabaseEnv,
      DATA_PROVIDER: 'aws',
      AWS_REGION: 'us-east-1',
    });
    expect(provider.name).toBe('aws');
  });

  it('fails loud when the mongodb adapter is selected without its keys', () => {
    expect(() => resolveDataProvider({ ...supabaseEnv, DATA_PROVIDER: 'mongodb' })).toThrow(
      /MONGODB_URI/,
    );
  });

  it('fails loud when the aws adapter is selected without its region', () => {
    expect(() => resolveDataProvider({ ...supabaseEnv, DATA_PROVIDER: 'aws' })).toThrow(
      /AWS_REGION/,
    );
  });
});

describe('resolveStorageProvider', () => {
  it('defaults to the supabase adapter', () => {
    expect(resolveStorageProvider(supabaseEnv).name).toBe('supabase');
  });

  it('constructs the s3 adapter from its AWS config', () => {
    const provider = resolveStorageProvider({
      ...supabaseEnv,
      STORAGE_PROVIDER: 's3',
      AWS_REGION: 'us-east-1',
    });
    expect(provider.name).toBe('s3');
  });

  it('fails loud when the s3 adapter is selected without its region', () => {
    expect(() => resolveStorageProvider({ ...supabaseEnv, STORAGE_PROVIDER: 's3' })).toThrow(
      /AWS_REGION/,
    );
  });

  it('constructs the r2 adapter from its config', () => {
    const provider = resolveStorageProvider({
      STORAGE_PROVIDER: 'r2',
      R2_ACCOUNT_ID: 'acct',
      R2_BUCKET: 'my-bucket',
      R2_ACCESS_KEY_ID: 'key',
      R2_SECRET_ACCESS_KEY: 'secret',
      R2_PUBLIC_URL: 'https://pub.r2.dev/my-bucket',
    });
    expect(provider.name).toBe('r2');
  });
});
