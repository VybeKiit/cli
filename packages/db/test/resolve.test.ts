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

const supabaseEnv = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
};

describe('resolveDataProvider', () => {
  it('defaults to the supabase adapter', () => {
    expect(resolveDataProvider(supabaseEnv).name).toBe('supabase');
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

  it('throws not-implemented for the s3 adapter', () => {
    expect(() => resolveStorageProvider({ ...supabaseEnv, STORAGE_PROVIDER: 's3' })).toThrow(
      /s3 storage adapter ships in a later step/,
    );
  });
});
