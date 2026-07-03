import { describe, expect, it, vi } from 'vitest';
import { type FetchLike, createCloudflareEmail } from '../providers/cloudflare';

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
  it('posts the email to the endpoint and returns the message id', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 'msg_1' }),
    }));

    const result = await createCloudflareEmail(config, fetchImpl).send(params);

    expect(result.ok && result.value.id).toBe('msg_1');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe('https://app.example.com/send');
    expect(init?.method).toBe('POST');
    expect(init?.headers.authorization).toBe('Bearer worker-secret');
    expect(JSON.parse(init?.body ?? '{}')).toMatchObject({
      to: 'buyer@example.com',
      from: 'hello@example.com',
      subject: 'Welcome',
      html: '<p>Hi</p>',
    });
  });

  it('maps a non-ok response to an api_error result', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    const result = await createCloudflareEmail(config, fetchImpl).send(params);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('api_error');
  });
});
