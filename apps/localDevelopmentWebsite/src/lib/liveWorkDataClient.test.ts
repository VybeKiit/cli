import { afterEach, describe, expect, it, vi } from 'vitest';
import { postLiveWorkData, shouldUseLiveWorkData } from './liveWorkDataClient';

afterEach(() => vi.unstubAllGlobals());

it('returns a stable failure for a malformed API response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json({ ok: true }))),
  );

  const apiResult = await postLiveWorkData({});

  expect(apiResult).toEqual({
    ok: false,
    code: 'invalid_response',
    message: 'The local Live Work API returned an invalid response.',
    events: [],
  });
});

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
