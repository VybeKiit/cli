import { afterEach, describe, expect, it, vi } from 'vitest';
import { postLiveWorkHost, shouldUseLiveWorkHost } from './liveWorkHostClient';

afterEach(() => vi.unstubAllGlobals());

it('returns a stable failure for a malformed API response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json({ ok: true }))),
  );

  const apiResult = await postLiveWorkHost({});

  expect(apiResult).toEqual({
    ok: false,
    code: 'invalid_response',
    message: 'The local Live Work API returned an invalid response.',
    events: [],
  });
});

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
