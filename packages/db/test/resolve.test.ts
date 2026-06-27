import { describe, expect, it } from 'vitest';
import { resolveDataProvider, resolveStorageProvider } from '../src/resolve';

const supabaseEnv = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
};

describe('resolveDataProvider', () => {
  it('defaults to the supabase adapter', () => {
    expect(resolveDataProvider(supabaseEnv).name).toBe('supabase');
  });

  it('throws not-implemented for the mongodb adapter', () => {
    expect(() => resolveDataProvider({ ...supabaseEnv, DATA_PROVIDER: 'mongodb' })).toThrow(
      /mongodb data adapter ships in a later step/,
    );
  });

  it('throws not-implemented for the aws adapter', () => {
    expect(() => resolveDataProvider({ ...supabaseEnv, DATA_PROVIDER: 'aws' })).toThrow(
      /aws data adapter ships in a later step/,
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
