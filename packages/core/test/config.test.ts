import { describe, expect, it } from 'vitest';
import { appConfigSchema, lemonSqueezyConfigSchema, parseEnv } from '../src/config';
import { err, fail, ok } from '../src/result';

describe('parseEnv', () => {
  it('applies defaults for the app config', () => {
    const config = parseEnv(appConfigSchema, {});
    expect(config.APP_URL).toBe('http://localhost:3000');
    expect(config.NODE_ENV).toBe('development');
  });

  it('returns validated values when present', () => {
    const config = parseEnv(lemonSqueezyConfigSchema, {
      LEMONSQUEEZY_API_KEY: 'key',
      LEMONSQUEEZY_STORE_ID: '123',
      LEMONSQUEEZY_WEBHOOK_SECRET: 'secret',
    });
    expect(config.LEMONSQUEEZY_STORE_ID).toBe('123');
  });

  it('throws a single error listing every missing key', () => {
    expect(() => parseEnv(lemonSqueezyConfigSchema, {})).toThrowError(
      /LEMONSQUEEZY_API_KEY[\s\S]*LEMONSQUEEZY_STORE_ID[\s\S]*LEMONSQUEEZY_WEBHOOK_SECRET/,
    );
  });
});

describe('Result helpers', () => {
  it('ok wraps a value', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it('err and fail wrap an error', () => {
    expect(err({ code: 'x', message: 'y' })).toEqual({
      ok: false,
      error: { code: 'x', message: 'y' },
    });
    expect(fail('bad', 'nope')).toEqual({ ok: false, error: { code: 'bad', message: 'nope' } });
  });
});
