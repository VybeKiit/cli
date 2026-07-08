import type { ObservabilityProvider } from '@vybekiit/core/observability/types';

/**
 * Create the local no-op observability provider.
 *
 * @returns A provider that accepts capture calls without sending them anywhere.
 * @example
 * const provider = createLocalObservabilityProvider();
 */
export const createLocalObservabilityProvider = (): ObservabilityProvider => ({
  name: 'local',
  captureException: () => {
    // intentional no-op
  },
  captureMessage: () => {
    // intentional no-op
  },
});
