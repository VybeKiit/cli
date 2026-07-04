import {
  appConfigSchema,
  godaddyConfigSchema,
  googleOAuthConfigSchema,
  lemonSqueezyConfigSchema,
  namecheapConfigSchema,
  parseEnv,
  securityConfigSchema,
} from '@vybekiit/core/config';
import { err, fail, ok } from '@vybekiit/core/result';
import { describe, expect, it } from 'vitest';

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

describe('securityConfigSchema', () => {
  it('is secure by default — protection on, sane limits', () => {
    const config = parseEnv(securityConfigSchema, {});
    expect(config.SECURITY_RATE_LIMIT).toBe('on');
    expect(config.SECURITY_ORIGIN_LOCK).toBe('on');
    expect(config.SECURITY_RATE_LIMIT_MAX).toBe(60);
    expect(config.SECURITY_RATE_LIMIT_AUTH_MAX).toBe(10);
    expect(config.SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX).toBe(30);
    expect(config.SECURITY_RATE_LIMIT_WINDOW_SECONDS).toBe(60);
    expect(config.SECURITY_ALLOWED_ORIGINS).toBe('');
  });

  it('treats a blank numeric env line as the default, not zero', () => {
    const config = parseEnv(securityConfigSchema, { SECURITY_RATE_LIMIT_MAX: '' });
    expect(config.SECURITY_RATE_LIMIT_MAX).toBe(60);
  });

  it('coerces a provided numeric string', () => {
    const config = parseEnv(securityConfigSchema, { SECURITY_RATE_LIMIT_MAX: '120' });
    expect(config.SECURITY_RATE_LIMIT_MAX).toBe(120);
  });

  it('rejects a non-positive or non-integer rate limit', () => {
    expect(() => parseEnv(securityConfigSchema, { SECURITY_RATE_LIMIT_MAX: '0' })).toThrowError(
      /SECURITY_RATE_LIMIT_MAX/,
    );
    expect(() => parseEnv(securityConfigSchema, { SECURITY_RATE_LIMIT_MAX: '1.5' })).toThrowError(
      /SECURITY_RATE_LIMIT_MAX/,
    );
  });

  it('rejects an unknown toggle value', () => {
    expect(() => parseEnv(securityConfigSchema, { SECURITY_RATE_LIMIT: 'yes' })).toThrowError(
      /SECURITY_RATE_LIMIT/,
    );
  });
});

describe('googleOAuthConfigSchema', () => {
  it('is fully optional — imports run before the agent provisions keys', () => {
    expect(parseEnv(googleOAuthConfigSchema, {})).toEqual({});
  });

  it('rejects a malformed redirect URI', () => {
    expect(() =>
      parseEnv(googleOAuthConfigSchema, { GOOGLE_OAUTH_REDIRECT_URI: 'not-a-url' }),
    ).toThrowError(/GOOGLE_OAUTH_REDIRECT_URI/);
  });
});

describe('namecheapConfigSchema', () => {
  it('allows all Namecheap vars to be absent', () => {
    expect(parseEnv(namecheapConfigSchema, {})).toEqual({});
  });

  it('requires all core keys when any Namecheap var is set', () => {
    expect(() => parseEnv(namecheapConfigSchema, { NAMECHEAP_API_USER: 'user' })).toThrowError(
      /NAMECHEAP_API_KEY/,
    );
  });
});

describe('godaddyConfigSchema', () => {
  it('allows all GoDaddy vars to be absent', () => {
    expect(parseEnv(godaddyConfigSchema, {})).toEqual({});
  });

  it('requires both keys when any GoDaddy var is set', () => {
    expect(() => parseEnv(godaddyConfigSchema, { GODADDY_API_KEY: 'key' })).toThrowError(
      /GODADDY_API_SECRET/,
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
