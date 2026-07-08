import { describe, expect, it } from 'vitest';
import { classifyRoute, isOriginLockExempt } from './routes';

describe('classifyRoute', () => {
  it('classifies auth routes as auth-strict', () => {
    expect(classifyRoute('/api/auth/signin')).toBe('auth-strict');
    expect(classifyRoute('/api/auth/signup')).toBe('auth-strict');
  });

  it('classifies public forms as public-form', () => {
    expect(classifyRoute('/api/contact')).toBe('public-form');
    expect(classifyRoute('/api/waitlist')).toBe('public-form');
  });

  it('classifies webhooks and exempts origin lock', () => {
    expect(classifyRoute('/api/webhook')).toBe('webhook');
    expect(isOriginLockExempt('webhook')).toBe(true);
    expect(isOriginLockExempt('auth-strict')).toBe(false);
  });

  it('classifies /api/me as authenticated', () => {
    expect(classifyRoute('/api/me')).toBe('authenticated');
  });
});
