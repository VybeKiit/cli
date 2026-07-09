import { createWebhook, deleteWebhook, listWebhooks } from '@lemonsqueezy/lemonsqueezy.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStoreWebhook,
  deleteStoreWebhook,
  ensureStoreWebhook,
  findStoreWebhookByUrl,
  listStoreWebhooks,
  ORDER_WEBHOOK_EVENTS,
} from './webhooks';

vi.mock('@lemonsqueezy/lemonsqueezy.js', () => ({
  lemonSqueezySetup: vi.fn(),
  createWebhook: vi.fn(),
  deleteWebhook: vi.fn(),
  listWebhooks: vi.fn(),
}));

const okResponse = (data: unknown) => ({ statusCode: 200, data, error: null }) as never;
const errorResponse = (statusCode: number, message: string) =>
  ({ statusCode, data: null, error: new Error(message) }) as never;

const webhookResource = (
  id: string,
  url: string,
  events: readonly string[],
  testMode: boolean,
) => ({
  id,
  attributes: { url, events, test_mode: testMode },
});

const WEBHOOK_URL = 'https://vybekiit.com/api/webhook';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createStoreWebhook', () => {
  it('creates a webhook, maps it, and never surfaces the secret', async () => {
    vi.mocked(createWebhook).mockResolvedValue(
      okResponse({
        data: webhookResource('900', WEBHOOK_URL, ['order_created', 'order_refunded'], true),
      }),
    );

    const webhook = await createStoreWebhook({ storeId: '1', url: WEBHOOK_URL, secret: 'sign-me' });

    expect(webhook).toEqual({
      id: '900',
      url: WEBHOOK_URL,
      events: ['order_created', 'order_refunded'],
      testMode: true,
    });
    expect(webhook).not.toHaveProperty('secret');

    const [call] = vi.mocked(createWebhook).mock.calls;
    expect(call?.[0]).toBe('1');
    expect(call?.[1]?.events).toEqual(ORDER_WEBHOOK_EVENTS);
    expect(call?.[1]?.secret).toBe('sign-me');
    expect(call?.[1]?.testMode).toBe(true);
  });

  it('throws with the SDK error detail when creation fails', async () => {
    vi.mocked(createWebhook).mockResolvedValue(errorResponse(422, 'Validation failed'));
    await expect(createStoreWebhook({ storeId: '1', url: 'x', secret: 's' })).rejects.toThrow(
      'Validation failed',
    );
  });
});

describe('finding and ensuring a store webhook', () => {
  it('matches an existing webhook URL despite a trailing slash', async () => {
    vi.mocked(listWebhooks).mockResolvedValue(
      okResponse({ data: [webhookResource('5', `${WEBHOOK_URL}/`, ['order_created'], true)] }),
    );
    const found = await findStoreWebhookByUrl('1', WEBHOOK_URL);
    expect(found?.id).toBe('5');
  });

  it('ensure returns the existing webhook without creating', async () => {
    vi.mocked(listWebhooks).mockResolvedValue(
      okResponse({ data: [webhookResource('5', WEBHOOK_URL, ['order_created'], true)] }),
    );
    const result = await ensureStoreWebhook({ storeId: '1', url: WEBHOOK_URL, secret: 's' });
    expect(result.created).toBe(false);
    expect(result.webhook.id).toBe('5');
    expect(createWebhook).not.toHaveBeenCalled();
  });

  it('ensure creates when no webhook matches the URL', async () => {
    vi.mocked(listWebhooks).mockResolvedValue(okResponse({ data: [] }));
    vi.mocked(createWebhook).mockResolvedValue(
      okResponse({ data: webhookResource('9', WEBHOOK_URL, ORDER_WEBHOOK_EVENTS, true) }),
    );
    const result = await ensureStoreWebhook({ storeId: '1', url: WEBHOOK_URL, secret: 's' });
    expect(result.created).toBe(true);
    expect(result.webhook.id).toBe('9');
  });
});

describe('listing and deleting store webhooks', () => {
  it('lists and maps store webhooks', async () => {
    vi.mocked(listWebhooks).mockResolvedValue(
      okResponse({
        data: [webhookResource('1', 'https://a.test/webhook', ['order_created'], false)],
      }),
    );
    const webhooks = await listStoreWebhooks('1');
    expect(webhooks).toEqual([
      { id: '1', url: 'https://a.test/webhook', events: ['order_created'], testMode: false },
    ]);
  });

  it('treats a 204 empty-body response as a successful delete', async () => {
    vi.mocked(deleteWebhook).mockResolvedValue(errorResponse(204, 'Unexpected end of JSON input'));
    await expect(deleteStoreWebhook('115148')).resolves.toBeUndefined();
  });

  it('throws when deletion truly fails', async () => {
    vi.mocked(deleteWebhook).mockResolvedValue(errorResponse(404, 'Not found'));
    await expect(deleteStoreWebhook('123')).rejects.toThrow('Not found');
  });
});
