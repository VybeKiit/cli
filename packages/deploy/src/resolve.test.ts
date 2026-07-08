import { resolveHosting } from '@vybekiit/deploy/resolve';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

// Stub the Amplify client so resolving the aws adapter never builds a real client or
// touches the network — construction must succeed offline and deterministically.
vi.mock('@aws-sdk/client-amplify', () => ({ AmplifyClient: class {} }));

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct',
  CLOUDFLARE_API_TOKEN: 'token',
};

// "VERCEL_TOKEN is missing" -> match
const VERCEL_TOKEN_PATTERN = /VERCEL_TOKEN/;

// "AWS_REGION is missing" -> match
const AWS_REGION_PATTERN = /AWS_REGION/;

describe('resolveHosting', () => {
  it('defaults to the cloudflare adapter', async () => {
    const hosting = await Effect.runPromise(resolveHosting(cloudflareEnv));

    expect(hosting.name).toBe('cloudflare');
  });

  it('constructs the vercel adapter from its config', async () => {
    const provider = await Effect.runPromise(
      resolveHosting({
        HOSTING_PROVIDER: 'vercel',
        VERCEL_TOKEN: 'token',
      }),
    );

    expect(provider.name).toBe('vercel');
  });

  it('constructs the railway adapter without required token keys', async () => {
    const provider = await Effect.runPromise(resolveHosting({ HOSTING_PROVIDER: 'railway' }));

    expect(provider.name).toBe('railway');
  });

  it('fails loud when the vercel adapter is selected without its token', async () => {
    const error = await Effect.runPromise(
      Effect.flip(resolveHosting({ HOSTING_PROVIDER: 'vercel' })),
    );

    expect(error.message).toMatch(VERCEL_TOKEN_PATTERN);
  });

  it('constructs the aws adapter from its config', async () => {
    const provider = await Effect.runPromise(
      resolveHosting({
        ...cloudflareEnv,
        HOSTING_PROVIDER: 'aws',
        AWS_REGION: 'us-east-1',
      }),
    );

    expect(provider.name).toBe('aws');
  });

  it('fails loud when the aws adapter is selected without its region', async () => {
    const error = await Effect.runPromise(
      Effect.flip(resolveHosting({ ...cloudflareEnv, HOSTING_PROVIDER: 'aws' })),
    );

    expect(error.message).toMatch(AWS_REGION_PATTERN);
  });
});
