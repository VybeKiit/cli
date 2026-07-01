import { describe, expect, it } from 'vitest';
import { handleCheckout, handlePracticeComplete, readWebhookRawBody } from '../src/http/handlers';
import { isPaymentsUnconfigured } from '../src/practice';

describe('isPaymentsUnconfigured', () => {
  it('is true when no payment anchor keys are set', () => {
    expect(isPaymentsUnconfigured({})).toBe(true);
  });

  it('is false when any provider key is present', () => {
    expect(isPaymentsUnconfigured({ STRIPE_SECRET_KEY: 'sk_test' })).toBe(false);
  });
});

describe('handleCheckout', () => {
  it('returns practice checkout url when unconfigured', async () => {
    const result = await handleCheckout(
      { productId: 'plan_pro' },
      { env: {}, appUrl: 'https://myapp.com', requestOrigin: null },
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      url: 'https://myapp.com/checkout/practice?productId=plan_pro',
    });
  });

  it('prefers frontendUrl for practice redirect', async () => {
    const result = await handleCheckout(
      { productId: 'plan_pro' },
      {
        env: {},
        appUrl: 'http://localhost:4000',
        frontendUrl: 'http://localhost:5173',
        requestOrigin: null,
      },
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      url: 'http://localhost:5173/checkout/practice?productId=plan_pro',
    });
  });

  it('requires productId', async () => {
    const result = await handleCheckout({}, {});
    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      code: 'bad_input',
      error: 'productId is required.',
    });
  });
});

describe('handlePracticeComplete', () => {
  it('fulfills a practice order', async () => {
    const result = await handlePracticeComplete(
      { productId: 'plan_pro' },
      {
        fulfillOrder: async () => ({ ok: true, value: true }),
      },
    );
    expect(result.status).toBe(200);
    if (!('ok' in result.body)) {
      throw new Error('Expected practice completion body');
    }
    expect(result.body.ok).toBe(true);
    if ('orderId' in result.body) {
      expect(result.body.orderId).toMatch(/^practice_plan_pro_/);
    }
  });
});

describe('readWebhookRawBody', () => {
  it('reads string and buffer bodies', () => {
    expect(readWebhookRawBody('raw')).toBe('raw');
    expect(readWebhookRawBody(Buffer.from('bytes'))).toBe('bytes');
  });

  it('throws for unexpected body shapes', () => {
    expect(() => readWebhookRawBody({})).toThrow(/raw bytes/);
  });
});
