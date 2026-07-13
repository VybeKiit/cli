import { describe, expect, it } from 'vitest';
import { shouldUseLiveWorkPayments } from './liveWorkPaymentsClient';

describe('shouldUseLiveWorkPayments', () => {
  it('is false by default (fixture path)', () => {
    expect(shouldUseLiveWorkPayments('', {})).toBe(false);
    expect(shouldUseLiveWorkPayments('?fixture=1', {})).toBe(false);
  });

  it('is true for live=1 query or NEXT_PUBLIC_LIVE_WORK', () => {
    expect(shouldUseLiveWorkPayments('?live=1', {})).toBe(true);
    expect(shouldUseLiveWorkPayments('?run=stripe&live=true', {})).toBe(true);
    expect(shouldUseLiveWorkPayments('', { NEXT_PUBLIC_LIVE_WORK: '1' })).toBe(true);
  });
});
