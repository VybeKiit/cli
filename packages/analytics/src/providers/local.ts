import type { AnalyticsProvider, TrackEventType } from '@vybekiit/analytics/types';
import { Effect } from 'effect';

/**
 * Build the local analytics adapter for offline scaffolds and tests.
 *
 * @returns An AnalyticsProvider whose methods complete without external network calls.
 * @example
 * const provider = createLocalAnalytics();
 */
export const createLocalAnalytics = (): AnalyticsProvider => {
  const events: TrackEventType[] = [];

  return {
    name: 'local',
    track: (event) =>
      Effect.sync(() => {
        events.push(event);
      }),
    identify: () => Effect.void,
    getScriptConfig: () => Effect.succeed(null),
  };
};
