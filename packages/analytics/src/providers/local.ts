import type { AnalyticsProvider, ScriptConfig, TrackEvent } from '../types';

export function createLocalAnalytics(): AnalyticsProvider {
  const events: TrackEvent[] = [];
  return {
    name: 'local',
    track(event: TrackEvent): void {
      events.push(event);
    },
    identify(): void {},
    getScriptConfig(): ScriptConfig | null {
      return null;
    },
  };
}
