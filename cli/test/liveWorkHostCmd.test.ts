import { describe, expect, it } from 'vitest';
import {
  parseLiveWorkHostFlags,
  toPublicLiveWorkHostResult,
} from '../src/commands/liveWorkHostCmd';

describe('parseLiveWorkHostFlags', () => {
  it('defaults to buyer mode', () => {
    const flags = parseLiveWorkHostFlags([]);
    expect(flags.mode).toBe('buyer');
    expect(flags.pin).toBe(true);
    expect(flags.error).toBeUndefined();
  });

  it('parses vendor and fresh', () => {
    const flags = parseLiveWorkHostFlags(['--vendor=vercel', '--fresh', '--mode=demo']);
    expect(flags.vendor).toBe('vercel');
    expect(flags.preferExisting).toBe(false);
    expect(flags.mode).toBe('demo');
  });

  it('rejects unknown vendor', () => {
    expect(parseLiveWorkHostFlags(['--vendor=aws']).error).toMatch(/Unknown vendor/);
  });
});

describe('toPublicLiveWorkHostResult', () => {
  it('exposes url and pin key names only', () => {
    const publicResult = toPublicLiveWorkHostResult(
      {
        provider: 'cloudflare',
        url: 'https://app.pages.dev',
        ephemeral: false,
        hopped: false,
        skipped: [],
        pin: { HOSTING_PROVIDER: 'cloudflare', APP_URL: 'https://app.pages.dev' },
        verified: true,
        buyerMessage: 'Your app is ready to go online on Cloudflare.',
      },
      true,
    );
    expect(publicResult.ok).toBe(true);
    expect(publicResult.url).toBe('https://app.pages.dev');
    expect(publicResult.pinKeys).toContain('HOSTING_PROVIDER');
    expect(publicResult.pinned).toBe(true);
  });
});
