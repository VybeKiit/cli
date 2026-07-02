import { parseEnv, securityConfigSchema } from '../config';
import { describe, expect, it } from 'vitest';
import { isStateChanging, parseAllowedOrigins, resolveSecurityPolicy } from './policy';

describe('parseAllowedOrigins', () => {
  it('splits, trims, lowercases, and drops blanks', () => {
    expect(parseAllowedOrigins('https://A.com, https://b.com ,')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('returns an empty list for a blank value (same-origin only)', () => {
    expect(parseAllowedOrigins('')).toEqual([]);
    expect(parseAllowedOrigins('  ,  ')).toEqual([]);
  });
});

describe('isStateChanging', () => {
  it('treats GET/HEAD/OPTIONS as safe and others as state-changing', () => {
    expect(isStateChanging('GET')).toBe(false);
    expect(isStateChanging('head')).toBe(false);
    expect(isStateChanging('POST')).toBe(true);
    expect(isStateChanging('delete')).toBe(true);
  });
});

describe('resolveSecurityPolicy', () => {
  it('maps the secure-by-default env into an enabled policy with tier limits', () => {
    const resolved = resolveSecurityPolicy(parseEnv(securityConfigSchema, {}));
    expect(resolved.rateLimit.enabled).toBe(true);
    expect(resolved.rateLimit.defaultMax).toBe(60);
    expect(resolved.rateLimit.windowSeconds).toBe(60);
    expect(resolved.rateLimit.tierMax['auth-strict']).toBe(10);
    expect(resolved.rateLimit.tierMax['public-form']).toBe(30);
    expect(resolved.originLock.enabled).toBe(true);
    expect(resolved.originLock.allowedOrigins).toEqual([]);
  });

  it('honors toggles flipped off', () => {
    const policy = resolveSecurityPolicy(
      parseEnv(securityConfigSchema, {
        SECURITY_RATE_LIMIT: 'off',
        SECURITY_ORIGIN_LOCK: 'off',
        SECURITY_ALLOWED_ORIGINS: 'https://shop.example.com',
      }),
    );
    expect(policy.rateLimit.enabled).toBe(false);
    expect(policy.originLock.enabled).toBe(false);
    expect(policy.originLock.allowedOrigins).toEqual(['https://shop.example.com']);
  });
});
