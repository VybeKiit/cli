import { describe, expect, it } from 'vitest';
import { resolveHosting } from '../src/resolve';

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct',
  CLOUDFLARE_API_TOKEN: 'token',
};

describe('resolveHosting', () => {
  it('defaults to the cloudflare adapter', () => {
    expect(resolveHosting(cloudflareEnv).name).toBe('cloudflare');
  });

  it('throws not-implemented for the aws adapter', () => {
    expect(() => resolveHosting({ ...cloudflareEnv, HOSTING_PROVIDER: 'aws' })).toThrow(
      /aws hosting adapter ships in a later step/,
    );
  });
});
