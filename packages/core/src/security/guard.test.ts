import { describe, expect, it } from 'vitest';
import { SecurityGuard } from './guard';
import { isOriginAllowed } from './origin';
import type { SecurityPolicy, SecurityRequest } from './types';

const APP_ORIGIN = 'https://myapp.com';

function policy(overrides: Partial<SecurityPolicy> = {}): SecurityPolicy {
  const tierMax = {
    'auth-strict': 2,
    'public-form': 30,
    webhook: 60,
    authenticated: 60,
    'public-read': 120,
    default: 60,
  };
  return {
    rateLimit: {
      enabled: true,
      windowSeconds: 60,
      defaultMax: 60,
      tierMax,
    },
    originLock: { enabled: true, allowedOrigins: [] },
    ...overrides,
  };
}

function request(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    method: 'POST',
    originHeader: APP_ORIGIN,
    appOrigin: APP_ORIGIN,
    clientId: '1.2.3.4',
    path: '/api/checkout',
    ...overrides,
  };
}

describe('isOriginAllowed', () => {
  const lock = policy().originLock;

  it('allows same origin and a missing Origin header', () => {
    expect(isOriginAllowed(APP_ORIGIN, APP_ORIGIN, lock)).toBe(true);
    expect(isOriginAllowed(null, APP_ORIGIN, lock)).toBe(true);
  });

  it('blocks a foreign origin unless allow-listed', () => {
    expect(isOriginAllowed('https://evil.com', APP_ORIGIN, lock)).toBe(false);
    expect(
      isOriginAllowed('https://evil.com', APP_ORIGIN, {
        enabled: true,
        allowedOrigins: ['https://evil.com'],
      }),
    ).toBe(true);
  });

  it('allows anything when the lock is off', () => {
    expect(
      isOriginAllowed('https://evil.com', APP_ORIGIN, { enabled: false, allowedOrigins: [] }),
    ).toBe(true);
  });
});

describe('SecurityGuard.evaluate', () => {
  it('allows a same-origin POST under the limit', () => {
    const guard = new SecurityGuard(policy());
    expect(guard.evaluate(request())).toEqual({ allowed: true });
  });

  it('blocks a cross-origin state-changing request', () => {
    const guard = new SecurityGuard(policy());
    const verdict = guard.evaluate(request({ originHeader: 'https://evil.com' }));
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe('origin');
  });

  it('does not origin-check safe reads', () => {
    const guard = new SecurityGuard(policy());
    expect(
      guard.evaluate(request({ method: 'GET', originHeader: 'https://evil.com' })).allowed,
    ).toBe(true);
  });

  it('blocks once the per-client rate limit is exceeded (auth-strict tier)', () => {
    const guard = new SecurityGuard(policy());
    const authReq = request({ path: '/api/auth/signin' });
    expect(guard.evaluate(authReq).allowed).toBe(true);
    expect(guard.evaluate(authReq).allowed).toBe(true);
    const verdict = guard.evaluate(authReq);
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe('rate-limit');
      expect(verdict.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('allows webhook POST without Origin (origin lock exempt)', () => {
    const guard = new SecurityGuard(policy());
    expect(
      guard.evaluate(
        request({
          path: '/api/webhook',
          originHeader: 'https://payments.example.com',
        }),
      ).allowed,
    ).toBe(true);
  });

  it('public-form tier survives more requests than auth-strict', () => {
    const guard = new SecurityGuard(policy());
    const contactReq = request({ path: '/api/contact' });
    for (let i = 0; i < 5; i++) {
      expect(guard.evaluate(contactReq).allowed).toBe(true);
    }
    const authReq = request({ path: '/api/auth/signin' });
    expect(guard.evaluate(authReq).allowed).toBe(true);
    expect(guard.evaluate(authReq).allowed).toBe(true);
    expect(guard.evaluate(authReq).allowed).toBe(false);
  });

  it('skips disabled checks', () => {
    const guard = new SecurityGuard(
      policy({
        rateLimit: {
          enabled: false,
          windowSeconds: 0,
          defaultMax: 0,
          tierMax: policy().rateLimit.tierMax,
        },
        originLock: { enabled: false, allowedOrigins: [] },
      }),
    );
    for (let i = 0; i < 10; i++) {
      expect(guard.evaluate(request({ originHeader: 'https://evil.com' })).allowed).toBe(true);
    }
  });
});
