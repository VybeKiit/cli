import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  track: vi.fn(),
}));

vi.mock('@vybekiit/analytics', () => ({
  resolveAnalyticsProvider: vi.fn(() => ({ track: mocks.track })),
}));

vi.mock('@vybekiit/observability', () => ({
  resolveObservabilityProvider: vi.fn(() => ({
    captureException: mocks.captureException,
    captureMessage: mocks.captureMessage,
  })),
}));

import { trackAuthEvent, captureAuthFailure, captureAuthRejection } from '../auth-telemetry.js';

describe('auth-telemetry', () => {
  beforeEach(() => {
    mocks.captureException.mockClear();
    mocks.captureMessage.mockClear();
    mocks.track.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('tracks sign-in success via analytics provider', () => {
    trackAuthEvent('sign_in_completed', { method: 'magic_link' });

    expect(mocks.track).toHaveBeenCalledWith({
      name: 'sign_in_completed',
      properties: { method: 'magic_link' },
    });
  });

  it('captures auth failures via observability', () => {
    const error = new Error('boom');
    captureAuthFailure(error, { route: 'signin' });

    expect(mocks.captureException).toHaveBeenCalledWith(error, {
      domain: 'auth',
      route: 'signin',
    });
  });

  it('captures expected rejections as warnings', () => {
    captureAuthRejection('Invalid code', { route: 'verify' });

    expect(mocks.captureMessage).toHaveBeenCalledWith('Invalid code', 'warning', {
      domain: 'auth',
      route: 'verify',
    });
  });
});
