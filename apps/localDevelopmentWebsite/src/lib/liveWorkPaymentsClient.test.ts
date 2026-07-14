import { afterEach, describe, expect, it, vi } from 'vitest';
import { postLiveWorkPayments, shouldUseLiveWorkPayments } from './liveWorkPaymentsClient';

afterEach(() => vi.unstubAllGlobals());

it('returns a stable failure for a malformed API response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json({ ok: true }))),
  );

  const apiResult = await postLiveWorkPayments({});

  expect(apiResult).toEqual({
    ok: false,
    code: 'invalid_response',
    message: 'The local Live Work API returned an invalid response.',
    events: [],
  });
});

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
