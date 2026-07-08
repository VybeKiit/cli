import { it } from '@effect/vitest';
import { resolveAnalyticsProvider } from '@vybekiit/analytics/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveAnalyticsProvider', () => {
  it.effect('defaults to the local adapter from Schema config', () =>
    Effect.gen(function* () {
      const analytics = yield* resolveAnalyticsProvider({});
      expect(analytics.name).toBe('local');
    }),
  );

  it.effect('fails loud when plausible is selected without a domain', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        resolveAnalyticsProvider({ ANALYTICS_PROVIDER: 'plausible' }),
      );
      expect(error.code).toBe('ANALYTICS_CONFIG_INVALID');
      expect(error.message).toContain('PLAUSIBLE_DOMAIN');
    }),
  );

  it.effect('rejects unregistered provider keys before adapter lookup', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveAnalyticsProvider({ ANALYTICS_PROVIDER: 'unknown' }));
      expect(error.code).toBe('ANALYTICS_CONFIG_INVALID');
      expect(error.message).toContain('ANALYTICS_PROVIDER');
    }),
  );

  it.effect('returns plausible script config when configured', () =>
    Effect.gen(function* () {
      const analytics = yield* resolveAnalyticsProvider({
        ANALYTICS_PROVIDER: 'plausible',
        PLAUSIBLE_DOMAIN: 'example.com',
      });
      const scriptConfig = yield* analytics.getScriptConfig();
      expect(analytics.name).toBe('plausible');
      expect(scriptConfig?.domain).toBe('example.com');
    }),
  );
});
