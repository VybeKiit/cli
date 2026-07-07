import { it } from '@effect/vitest';
import {
  parseWorkerSendBody,
  senderDomain,
  toWorkerSendBody,
} from '@vybekiit/email/cloudflare/workerContract';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('worker-contract', () => {
  it.effect('round-trips SendEmailParams through JSON', () =>
    Effect.gen(function* () {
      const body = toWorkerSendBody({
        to: 'a@b.com',
        from: 'hello@vybekiit.com',
        subject: 'Hi',
        html: '<p>Hi</p>',
        text: 'Hi',
      });

      expect(yield* parseWorkerSendBody(body)).toEqual(body);
    }),
  );

  it.effect('rejects incomplete bodies', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(parseWorkerSendBody({ to: 'a@b.com' }));
      expect(error._tag).toBe('ParseError');
    }),
  );

  it('extracts sender domain', () => {
    expect(senderDomain('hello@vybekiit.com')).toBe('vybekiit.com');
  });
});
