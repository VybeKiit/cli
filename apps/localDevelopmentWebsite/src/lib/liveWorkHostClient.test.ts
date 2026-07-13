import { describe, expect, it } from 'vitest';
import { shouldUseLiveWorkHost } from './liveWorkHostClient';

describe('shouldUseLiveWorkHost', () => {
  it('is false by default (fixture path)', () => {
    expect(shouldUseLiveWorkHost('', {})).toBe(false);
    expect(shouldUseLiveWorkHost('?fixture=1', {})).toBe(false);
  });

  it('is true for live=1 query or NEXT_PUBLIC_LIVE_WORK', () => {
    expect(shouldUseLiveWorkHost('?live=1', {})).toBe(true);
    expect(shouldUseLiveWorkHost('?run=cloudflare&live=true', {})).toBe(true);
    expect(shouldUseLiveWorkHost('', { NEXT_PUBLIC_LIVE_WORK: '1' })).toBe(true);
  });
});
