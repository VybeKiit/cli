import { describe, expect, it } from 'vitest';
import { toHostLiveWorkErrorEvent, toHostLiveWorkJourneyEvents } from './journeyEvents';
import type { HostLiveWorkResult } from './types';

const success = (partial: Partial<HostLiveWorkResult> = {}): HostLiveWorkResult => ({
  provider: 'cloudflare',
  ephemeral: true,
  hopped: false,
  skipped: [],
  pin: { HOSTING_PROVIDER: 'cloudflare', APP_URL: 'https://x.pages.dev' },
  verified: true,
  buyerMessage: 'Your app is ready to go online on Cloudflare.',
  url: 'https://x.pages.dev',
  ...partial,
});

describe('toHostLiveWorkJourneyEvents', () => {
  it('emits start/end pairs covering deploy toolHints', () => {
    const events = toHostLiveWorkJourneyEvents(success());
    expect(events.length).toBeGreaterThanOrEqual(6);
    expect(events.every((e) => e.phase === 'start' || e.phase === 'end')).toBe(true);
    const names = events.map((e) => e.name).join(' ');
    expect(names).toMatch(/cloudflare/);
    expect(names).toMatch(/publish/);
    expect(names).toMatch(/health/);
    expect(names).toMatch(/verify/);
  });

  it('never puts tokens or secrets in event details', () => {
    const events = toHostLiveWorkJourneyEvents(
      success({
        pin: {
          HOSTING_PROVIDER: 'vercel',
          APP_URL: 'https://x.vercel.app',
          VERCEL_TOKEN: 'secret-token-value',
        },
      }),
    );
    const blob = JSON.stringify(events);
    expect(blob).not.toContain('secret-token-value');
    expect(blob).not.toContain('VERCEL_TOKEN');
  });

  it('mentions hop in choose detail when free-tier hopped', () => {
    const events = toHostLiveWorkJourneyEvents(
      success({ provider: 'render', hopped: true, fromProvider: 'cloudflare' }),
    );
    const choose = events.find((e) => e.name.includes('render') && e.phase === 'start');
    expect(choose?.detail).toMatch(/cloudflare/i);
  });
});

describe('toHostLiveWorkErrorEvent', () => {
  it('is error phase with safe code', () => {
    const event = toHostLiveWorkErrorEvent('ladder_exhausted', 'No path left');
    expect(event.phase).toBe('error');
    expect(event.detail).toContain('ladder_exhausted');
  });
});
