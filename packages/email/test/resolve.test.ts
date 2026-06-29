import { describe, expect, it, vi } from 'vitest';
import { resolveEmailProvider } from '../src/resolve';

// Stub the SES client so resolving the ses adapter never opens a real connection —
// construction must succeed offline and deterministically.
vi.mock('@aws-sdk/client-sesv2', () => ({ SESv2Client: class {} }));

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct',
  CLOUDFLARE_API_TOKEN: 'token',
};

describe('resolveEmailProvider', () => {
  it('defaults to the cloudflare adapter', () => {
    expect(resolveEmailProvider(cloudflareEnv).name).toBe('cloudflare');
  });

  it('constructs the ses adapter from its AWS config', () => {
    const provider = resolveEmailProvider({
      ...cloudflareEnv,
      EMAIL_PROVIDER: 'ses',
      AWS_REGION: 'us-east-1',
    });
    expect(provider.name).toBe('ses');
  });

  it('fails loud when the ses adapter is selected without its region', () => {
    expect(() => resolveEmailProvider({ ...cloudflareEnv, EMAIL_PROVIDER: 'ses' })).toThrow(
      /AWS_REGION/,
    );
  });

  it('constructs the resend adapter from its API key', () => {
    const provider = resolveEmailProvider({
      EMAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test',
    });
    expect(provider.name).toBe('resend');
  });
});
