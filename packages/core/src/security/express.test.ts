import { describe, expect, it, vi } from 'vitest';
import { createExpressSecurityMiddleware } from './express';
import { SecurityGuard } from './guard';
import type { SecurityPolicy } from './types';

const APP_ORIGIN = 'https://myapp.com';

const strictPolicy = (): SecurityPolicy => ({
  rateLimit: {
    enabled: false,
    windowSeconds: 60,
    defaultMax: 60,
    tierMax: {
      'auth-strict': 2,
      'public-form': 30,
      webhook: 60,
      authenticated: 60,
      'public-read': 120,
      default: 60,
    },
  },
  originLock: { enabled: true, allowedOrigins: [] },
});

const mockRes = () => {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    body: undefined as unknown,
  };
  return res;
};

describe('createExpressSecurityMiddleware', () => {
  it('blocks cross-origin state-changing API requests', () => {
    const middleware = createExpressSecurityMiddleware({
      guard: new SecurityGuard(strictPolicy()),
      appOrigin: APP_ORIGIN,
    });
    const req = {
      method: 'POST',
      headers: { origin: 'https://evil.com' },
      path: '/checkout',
      ip: '1.2.3.4',
    };
    const res = mockRes();
    const next = vi.fn();
    middleware(req as never, res as never, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows same-origin requests through', () => {
    const middleware = createExpressSecurityMiddleware({
      guard: new SecurityGuard(strictPolicy()),
      appOrigin: APP_ORIGIN,
    });
    const req = {
      method: 'POST',
      headers: { origin: APP_ORIGIN },
      path: '/checkout',
      ip: '1.2.3.4',
    };
    const res = mockRes();
    const next = vi.fn();
    middleware(req as never, res as never, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
