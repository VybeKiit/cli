import { describe, expect, it } from 'vitest';
import {
  isCloudflareUnconfigured,
  isRailwayStackActive,
  isSupabaseUnconfigured,
  needsAwsCliFromAuxiliaryProviders,
} from '../src/provider-dispatch';

describe('isCloudflareUnconfigured', () => {
  it('is true when account id or token is missing', () => {
    expect(isCloudflareUnconfigured({})).toBe(true);
    expect(isCloudflareUnconfigured({ CLOUDFLARE_ACCOUNT_ID: 'a' })).toBe(true);
  });

  it('is false when both are set', () => {
    expect(
      isCloudflareUnconfigured({
        CLOUDFLARE_ACCOUNT_ID: 'a',
        CLOUDFLARE_API_TOKEN: 't',
      }),
    ).toBe(false);
  });
});

describe('isSupabaseUnconfigured', () => {
  it('is true when url or anon key is missing', () => {
    expect(isSupabaseUnconfigured({})).toBe(true);
    expect(isSupabaseUnconfigured({ SUPABASE_URL: 'https://x.supabase.co' })).toBe(true);
  });

  it('is false when both are set', () => {
    expect(
      isSupabaseUnconfigured({
        SUPABASE_URL: 'https://x.supabase.co',
        SUPABASE_ANON_KEY: 'anon',
      }),
    ).toBe(false);
  });
});

describe('isRailwayStackActive', () => {
  it('is true for railway hosting or data', () => {
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'railway' })).toBe(true);
    expect(isRailwayStackActive({ DATA_PROVIDER: 'railway' })).toBe(true);
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'railway' })).toBe(
      true,
    );
  });

  it('is false for default cloudflare + supabase', () => {
    expect(isRailwayStackActive({})).toBe(false);
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'cloudflare' })).toBe(false);
  });
});

describe('needsAwsCliFromAuxiliaryProviders', () => {
  it('is true for storage s3, email ses, or auth cognito', () => {
    expect(needsAwsCliFromAuxiliaryProviders({ STORAGE_PROVIDER: 's3' })).toBe(true);
    expect(needsAwsCliFromAuxiliaryProviders({ EMAIL_PROVIDER: 'ses' })).toBe(true);
    expect(needsAwsCliFromAuxiliaryProviders({ AUTH_PROVIDER: 'cognito' })).toBe(true);
  });

  it('is false for defaults and aws hosting/data alone', () => {
    expect(needsAwsCliFromAuxiliaryProviders({})).toBe(false);
    expect(needsAwsCliFromAuxiliaryProviders({ HOSTING_PROVIDER: 'aws' })).toBe(false);
    expect(needsAwsCliFromAuxiliaryProviders({ DATA_PROVIDER: 'aws' })).toBe(false);
  });
});
