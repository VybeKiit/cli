import { describe, expect, it, vi } from 'vitest';
import { resolveEmailProvider } from '../resolve';

// Stub the SES client so resolving the ses adapter never opens a real connection —
// construction must succeed offline and deterministically.
vi.mock('@aws-sdk/client-sesv2', () => ({ SESv2Client: class {} }));

const cloudflareEnv = {
  EMAIL_WORKER_SECRET: 'worker-secret',
  CLOUDFLARE_EMAIL_ENDPOINT: 'https://app.example.com/send',
};

describe('resolveEmailProvider', () => {
  it('defaults to the cloudflare adapter', () => {
    expect(resolveEmailProvider(cloudflareEnv).name).toBe('cloudflare');
  });

  it('fails loud when cloudflare email creds are missing', () => {
    expect(() => resolveEmailProvider({})).toThrow(/EMAIL_WORKER_SECRET/);
  });

  it('constructs the ses adapter from its AWS config', () => {
    const provider = resolveEmailProvider({
      EMAIL_PROVIDER: 'ses',
      AWS_REGION: 'us-east-1',
    });
    expect(provider.name).toBe('ses');
  });

  it('fails loud when the ses adapter is selected without its region', () => {
    expect(() => resolveEmailProvider({ EMAIL_PROVIDER: 'ses' })).toThrow(/AWS_REGION/);
  });

  it('constructs the resend adapter from its API key', () => {
    const provider = resolveEmailProvider({
      EMAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test',
    });
    expect(provider.name).toBe('resend');
  });
});
