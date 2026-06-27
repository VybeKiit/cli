import { describe, expect, it, vi } from 'vitest';
import { resolveHosting } from '../src/resolve';

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
