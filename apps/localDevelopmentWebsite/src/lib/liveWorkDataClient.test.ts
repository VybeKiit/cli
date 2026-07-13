import { describe, expect, it } from 'vitest';
import { shouldUseLiveWorkData } from './liveWorkDataClient';

describe('shouldUseLiveWorkData', () => {
  it('is false by default (fixture path)', () => {
    expect(shouldUseLiveWorkData('', {})).toBe(false);
    expect(shouldUseLiveWorkData('?fixture=1', {})).toBe(false);
  });

  it('is true for live=1 query or NEXT_PUBLIC_LIVE_WORK', () => {
    expect(shouldUseLiveWorkData('?live=1', {})).toBe(true);
    expect(shouldUseLiveWorkData('?run=neon&live=true', {})).toBe(true);
    expect(shouldUseLiveWorkData('', { NEXT_PUBLIC_LIVE_WORK: '1' })).toBe(true);
  });
});
