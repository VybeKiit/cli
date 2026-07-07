import { describe, expect, it, vi } from 'vitest';

import {
  createLocalObservabilityProvider,
  createSentryObservabilityProvider,
  initSentry,
  resetSentryForTests,
  resolveObservabilityProvider,
} from './index';

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// "SENTRY_DSN is required" -> match
const SENTRY_DSN_PATTERN = /SENTRY_DSN/;

describe('createLocalObservabilityProvider', () => {
  it('does not throw when capturing', () => {
    const provider = createLocalObservabilityProvider();
    expect(() => provider.captureException(new Error('x'))).not.toThrow();
    expect(() => provider.captureMessage('hi')).not.toThrow();
  });
});

describe('resolveObservabilityProvider', () => {
  it('returns local by default', () => {
    const provider = resolveObservabilityProvider({});
    expect(provider.name).toBe('local');
  });

  it('throws when sentry is selected without DSN', () => {
    expect(() => resolveObservabilityProvider({ OBSERVABILITY_PROVIDER: 'sentry' })).toThrow(
      SENTRY_DSN_PATTERN,
    );
  });

  it('returns sentry when DSN is present', async () => {
    resetSentryForTests();
    const Sentry = await import('@sentry/node');
    const provider = resolveObservabilityProvider({
      OBSERVABILITY_PROVIDER: 'sentry',
      SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      NODE_ENV: 'test',
    });
    expect(provider.name).toBe('sentry');
    expect(Sentry.init).toHaveBeenCalled();
  });
});

describe('createSentryObservabilityProvider', () => {
  it('forwards capture calls to Sentry', async () => {
    resetSentryForTests();
    initSentry({ dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0' });
    const Sentry = await import('@sentry/node');
    const provider = createSentryObservabilityProvider();
    const err = new Error('boom');
    provider.captureException(err, { route: '/api/x' });
    provider.captureMessage('hello', 'warning');
    expect(Sentry.captureException).toHaveBeenCalledWith(err, { extra: { route: '/api/x' } });
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });
});
