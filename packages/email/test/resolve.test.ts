import { describe, expect, it } from 'vitest';
import { resolveEmailProvider } from '../src/resolve';

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct',
  CLOUDFLARE_API_TOKEN: 'token',
};

describe('resolveEmailProvider', () => {
  it('defaults to the cloudflare adapter', () => {
    expect(resolveEmailProvider(cloudflareEnv).name).toBe('cloudflare');
  });

  it('throws not-implemented for the ses adapter', () => {
    expect(() => resolveEmailProvider({ ...cloudflareEnv, EMAIL_PROVIDER: 'ses' })).toThrow(
      /ses email adapter ships in a later step/,
    );
  });

  it('throws not-implemented for the resend adapter', () => {
    expect(() => resolveEmailProvider({ ...cloudflareEnv, EMAIL_PROVIDER: 'resend' })).toThrow(
      /resend email adapter ships in a later step/,
    );
  });
});
