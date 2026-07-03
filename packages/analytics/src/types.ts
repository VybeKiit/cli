export type AnalyticsProviderName = 'plausible' | 'posthog' | 'local';

export interface TrackEvent {
  readonly name: string;
  readonly properties?: Record<string, string | number | boolean> | undefined;
}

export interface ScriptConfig {
  readonly src?: string | undefined;
  readonly inlineScript?: string | undefined;
  readonly domain?: string | undefined;
}

export interface AnalyticsProvider {
  readonly name: AnalyticsProviderName;
  track(event: TrackEvent): void;
  identify(userId: string, traits?: Record<string, string> | undefined): void;
  getScriptConfig(): ScriptConfig | null;
}
