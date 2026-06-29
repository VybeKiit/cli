import { describe, expect, it } from 'vitest';
import { resolveAnalyticsProvider } from '../src/resolve';

describe('resolveAnalyticsProvider', () => {
  it('defaults to local when plausible domain missing', () => {
    const analytics = resolveAnalyticsProvider({ ANALYTICS_PROVIDER: 'plausible' });
    expect(analytics.name).toBe('local');
  });

  it('returns plausible script config when configured', () => {
    const analytics = resolveAnalyticsProvider({
      ANALYTICS_PROVIDER: 'plausible',
      PLAUSIBLE_DOMAIN: 'example.com',
    });
    expect(analytics.name).toBe('plausible');
    expect(analytics.getScriptConfig()?.domain).toBe('example.com');
  });
});
