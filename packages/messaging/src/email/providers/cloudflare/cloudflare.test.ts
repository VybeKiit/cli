import { it } from '@effect/vitest';
import { Effect } from 'effect';
import { describe, expect, vi } from 'vitest';
import { createCloudflareEmail, type FetchLike } from './index';

const config = {
  EMAIL_WORKER_SECRET: 'worker-secret',
  CLOUDFLARE_EMAIL_ENDPOINT: 'https://app.example.com/send',
};

const params = {
  to: 'buyer@example.com',
  from: 'hello@example.com',
  subject: 'Welcome',
  html: '<p>Hi</p>',
};

describe('createCloudflareEmail.send', () => {
  it.effect('posts the email to the endpoint and returns the message id', () =>
    Effect.gen(function* () {
      const fetchImpl = vi.fn<FetchLike>(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'msg_1' }),
        }),
      );

      const result = yield* createCloudflareEmail(config, fetchImpl).send(params);

      expect(result.id).toBe('msg_1');
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      const [call] = fetchImpl.mock.calls;
      if (call === undefined) {
        throw new Error('Expected Cloudflare email fetch to be called.');
      }
      const [url, init] = call;
      expect(url).toBe('https://app.example.com/send');
      expect(init.method).toBe('POST');
      expect(init.headers.authorization).toBe('Bearer worker-secret');
      expect(JSON.parse(init.body)).toMatchObject({
        to: 'buyer@example.com',
        from: 'hello@example.com',
        subject: 'Welcome',
        html: '<p>Hi</p>',
      });
    }),
  );

  it.effect('maps a non-ok response to EMAIL_SEND_FAILED', () =>
    Effect.gen(function* () {
      const fetchImpl = vi.fn<FetchLike>(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        }),
      );

      const error = yield* Effect.flip(createCloudflareEmail(config, fetchImpl).send(params));

      expect(error.code).toBe('EMAIL_SEND_FAILED');
    }),
  );
});
