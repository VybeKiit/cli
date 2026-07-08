import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackAuthEvent, captureAuthFailure, captureAuthRejection } from '@/lib/authTelemetry';

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  track: vi.fn(),
}));

vi.mock('@vybekiit/analytics', () => ({
  resolveAnalyticsProvider: vi.fn(() =>
    Effect.succeed({
      track: (event: unknown) => Effect.sync(() => mocks.track(event)),
    }),
  ),
}));

vi.mock('@/lib/observability', () => ({
  observability: {
    captureException: mocks.captureException,
    captureMessage: mocks.captureMessage,
  },
}));

describe('auth-telemetry', () => {
  beforeEach(() => {
    mocks.captureException.mockClear();
    mocks.captureMessage.mockClear();
    mocks.track.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('tracks signup success via analytics provider', () => {
    trackAuthEvent('signup_completed', { method: 'password' });

    expect(mocks.track).toHaveBeenCalledWith({
      name: 'signup_completed',
      properties: { method: 'password' },
    });
  });

  it('captures auth failures via observability', () => {
    const error = new Error('boom');
    captureAuthFailure(error, { route: 'signup' });

    expect(mocks.captureException).toHaveBeenCalledWith(error, {
      domain: 'auth',
      route: 'signup',
    });
  });

  it('captures expected rejections as warnings', () => {
    captureAuthRejection('Invalid password', { route: 'signin', code: 'invalid_credentials' });

    expect(mocks.captureMessage).toHaveBeenCalledWith('Invalid password', 'warning', {
      domain: 'auth',
      route: 'signin',
      code: 'invalid_credentials',
    });
  });
});
