import { Effect, Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { decodeLiveWorkApiResponse } from './liveWorkApiResponse';

describe('decodeLiveWorkApiResponse', () => {
  it('returns a stable client failure when the response does not match the schema', async () => {
    const apiResult = await Effect.runPromise(
      decodeLiveWorkApiResponse({ ok: true }, Schema.Struct({ ok: Schema.Literal(false) })),
    );

    expect(apiResult).toEqual({
      ok: false,
      code: 'invalid_response',
      message: 'The local Live Work API returned an invalid response.',
      events: [],
    });
  });

  it('returns a decoded response when the schema matches', async () => {
    const apiResult = await Effect.runPromise(
      decodeLiveWorkApiResponse({ ok: true }, Schema.Struct({ ok: Schema.Literal(true) })),
    );

    expect(apiResult).toEqual({ ok: true });
  });
});
