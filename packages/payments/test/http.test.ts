import { describe, expect, it } from 'vitest';
import { handleCheckout, readWebhookRawBody } from '../src/http/handlers';
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

  it('requires productId', async () => {
    const result = await handleCheckout({}, {});
    expect(result.status).toBe(400);
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
