// biome-ignore-all lint/security/noSecrets: placeholder test values are not secrets.
import { parseEnv } from '@vybekiit/core';
import { describe, expect, it } from 'vitest';
import { LemonSqueezyConfigSchema, resolveLemonSqueezyEnv, resolveStoreProductId } from './config';

describe('resolveLemonSqueezyEnv', () => {
  const live = {
    LEMONSQUEEZY_API_KEY: 'live-api-key',
    LEMONSQUEEZY_STORE_ID: '270009',
    LEMONSQUEEZY_WEBHOOK_SECRET: 'live-webhook-secret',
  } as const;

  const testKeys = {
    LEMONSQUEEZY_TEST_MODE_API_KEY: 'test-api-key',
    LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET: 'test-webhook-secret',
  } as const;

  it('uses live keys when test mode is off (production)', () => {
    const resolved = resolveLemonSqueezyEnv({
      ...live,
      ...testKeys,
      LEMONSQUEEZY_TEST_MODE: 'false',
    });

    expect(resolved.LEMONSQUEEZY_API_KEY).toBe('live-api-key');
    expect(resolved.LEMONSQUEEZY_WEBHOOK_SECRET).toBe('live-webhook-secret');
    expect(resolved.LEMONSQUEEZY_TEST_MODE).toBe('false');
  });

  it('never reads test keys when test mode is off, even if they are set', () => {
    const config = parseEnv(
      LemonSqueezyConfigSchema,
      resolveLemonSqueezyEnv({
        ...live,
        ...testKeys,
        LEMONSQUEEZY_TEST_MODE: 'false',
      }),
    );

    expect(config.LEMONSQUEEZY_API_KEY).toBe('live-api-key');
    expect(config.LEMONSQUEEZY_WEBHOOK_SECRET).toBe('live-webhook-secret');
    expect(config.LEMONSQUEEZY_TEST_MODE).toBe(false);
  });

  it('prefers test keys when test mode is on and the test API key is set', () => {
    const config = parseEnv(
      LemonSqueezyConfigSchema,
      resolveLemonSqueezyEnv({
        ...live,
        ...testKeys,
        LEMONSQUEEZY_TEST_MODE: 'true',
      }),
    );

    expect(config.LEMONSQUEEZY_API_KEY).toBe('test-api-key');
    expect(config.LEMONSQUEEZY_WEBHOOK_SECRET).toBe('test-webhook-secret');
    expect(config.LEMONSQUEEZY_STORE_ID).toBe('270009');
    expect(config.LEMONSQUEEZY_TEST_MODE).toBe(true);
  });

  it('does not fall back to the live webhook secret when the test API key is active', () => {
    expect(() =>
      parseEnv(
        LemonSqueezyConfigSchema,
        resolveLemonSqueezyEnv({
          ...live,
          LEMONSQUEEZY_TEST_MODE: 'true',
          LEMONSQUEEZY_TEST_MODE_API_KEY: 'test-api-key',
          // intentionally omit LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET
        }),
      ),
    ).toThrow(/LEMONSQUEEZY_WEBHOOK_SECRET/);
  });

  it('falls back to live keys in test mode when no test API key is set', () => {
    const config = parseEnv(
      LemonSqueezyConfigSchema,
      resolveLemonSqueezyEnv({
        ...live,
        LEMONSQUEEZY_TEST_MODE: 'true',
      }),
    );

    expect(config.LEMONSQUEEZY_API_KEY).toBe('live-api-key');
    expect(config.LEMONSQUEEZY_WEBHOOK_SECRET).toBe('live-webhook-secret');
    expect(config.LEMONSQUEEZY_TEST_MODE).toBe(true);
  });
});

describe('resolveStoreProductId', () => {
  it('returns the test variant when test-mode keys are active', () => {
    expect(
      resolveStoreProductId({
        STORE_PRODUCT_ID: '1855372',
        LEMONSQUEEZY_TEST_MODE: 'true',
        LEMONSQUEEZY_TEST_MODE_API_KEY: 'test-api-key',
        LEMONSQUEEZY_TEST_MODE_STORE_PRODUCT_ID: '1855382',
      }),
    ).toBe('1855382');
  });

  it('returns the live STORE_PRODUCT_ID in production', () => {
    expect(
      resolveStoreProductId({
        STORE_PRODUCT_ID: '1855372',
        LEMONSQUEEZY_TEST_MODE: 'false',
        LEMONSQUEEZY_TEST_MODE_API_KEY: 'test-api-key',
        LEMONSQUEEZY_TEST_MODE_STORE_PRODUCT_ID: '1855382',
      }),
    ).toBe('1855372');
  });
});
