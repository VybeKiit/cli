import { resolveHosting } from '@vybekiit/deploy/resolve';
import { describe, expect, it, vi } from 'vitest';

// Stub the Amplify client so resolving the aws adapter never builds a real client or
// touches the network — construction must succeed offline and deterministically.
vi.mock('@aws-sdk/client-amplify', () => ({ AmplifyClient: class {} }));

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct',
  CLOUDFLARE_API_TOKEN: 'token',
};

describe('resolveHosting', () => {
  it('defaults to the cloudflare adapter', () => {
    expect(resolveHosting(cloudflareEnv).name).toBe('cloudflare');
  });

  it('constructs the vercel adapter from its config', () => {
    const provider = resolveHosting({
      HOSTING_PROVIDER: 'vercel',
      VERCEL_TOKEN: 'token',
    });
    expect(provider.name).toBe('vercel');
  });

  it('constructs the railway adapter without required token keys', () => {
    const provider = resolveHosting({ HOSTING_PROVIDER: 'railway' });
    expect(provider.name).toBe('railway');
  });

  it('fails loud when the vercel adapter is selected without its token', () => {
    expect(() => resolveHosting({ HOSTING_PROVIDER: 'vercel' })).toThrow(/VERCEL_TOKEN/);
  });

  it('constructs the aws adapter from its config', () => {
    const provider = resolveHosting({
      ...cloudflareEnv,
      HOSTING_PROVIDER: 'aws',
      AWS_REGION: 'us-east-1',
    });
    expect(provider.name).toBe('aws');
  });

  it('fails loud when the aws adapter is selected without its region', () => {
    expect(() => resolveHosting({ ...cloudflareEnv, HOSTING_PROVIDER: 'aws' })).toThrow(
      /AWS_REGION/,
    );
  });
});
