import type { ObservabilityProvider } from '@vybekiit/core/observability/types';

/** No-op observability — default until track-errors wires Sentry (ADR-0008 pattern). */
export function createLocalObservabilityProvider(): ObservabilityProvider {
  return {
    name: 'local',
    captureException() {
      // intentional no-op
    },
    captureMessage() {
      // intentional no-op
    },
  };
}
