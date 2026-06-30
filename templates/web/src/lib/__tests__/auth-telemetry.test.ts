import { trackAuthEvent, captureAuthFailure, captureAuthRejection } from '@/lib/auth-telemetry';
import { resolveAnalyticsProvider } from '@vybekiit/analytics';
import { observability } from '@/lib/observability';

vi.mock('@vybekiit/analytics', () => ({
  resolveAnalyticsProvider: vi.fn(),
}));

vi.mock('@/lib/observability', () => ({
  observability: {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  },
}));

describe('auth-telemetry', () => {
  beforeEach(() => {
    vi.mocked(resolveAnalyticsProvider).mockReturnValue({
      track: vi.fn(),
    } as ReturnType<typeof resolveAnalyticsProvider>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks signup success via analytics provider', () => {
    const track = vi.fn();
    vi.mocked(resolveAnalyticsProvider).mockReturnValue({ track } as ReturnType<
      typeof resolveAnalyticsProvider
    >);

    trackAuthEvent('signup_completed', { method: 'password' });

    expect(track).toHaveBeenCalledWith({
      name: 'signup_completed',
      properties: { method: 'password' },
    });
  });

  it('captures auth failures via observability', () => {
    const error = new Error('boom');
    captureAuthFailure(error, { route: 'signup' });

    expect(observability.captureException).toHaveBeenCalledWith(error, {
      domain: 'auth',
      route: 'signup',
    });
  });

  it('captures expected rejections as warnings', () => {
    captureAuthRejection('Invalid password', { route: 'signin', code: 'invalid_credentials' });

    expect(observability.captureMessage).toHaveBeenCalledWith('Invalid password', 'warning', {
      domain: 'auth',
      route: 'signin',
      code: 'invalid_credentials',
    });
  });
});
