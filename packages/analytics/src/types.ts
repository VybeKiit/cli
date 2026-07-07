import type { AnalyticsProviderNameType } from '@vybekiit/analytics/config';
import { Data, type Effect, Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** Event property values accepted by analytics adapters. */
export const AnalyticsPropertyValue = Schema.Union(Schema.String, Schema.Number, Schema.Boolean);

/** Static type inferred from {@link AnalyticsPropertyValue}. */
export type AnalyticsPropertyValueType = Schema.Schema.Type<typeof AnalyticsPropertyValue>;

/** Event payload sent through the analytics service. */
export const TrackEvent = Schema.Struct({
  name: NonEmptyString,
  properties: Schema.optional(Schema.Record({ key: Schema.String, value: AnalyticsPropertyValue })),
});

/** Static type inferred from {@link TrackEvent}. */
export type TrackEventType = Schema.Schema.Type<typeof TrackEvent>;

/** Backward-compatible track event alias during the Schema migration. */
export type TrackEvent = TrackEventType;

/** Browser script configuration returned by script-based analytics adapters. */
export const ScriptConfig = Schema.Struct({
  src: Schema.optional(NonEmptyString),
  inlineScript: Schema.optional(Schema.String),
  domain: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link ScriptConfig}. */
export type ScriptConfigType = Schema.Schema.Type<typeof ScriptConfig>;

/** Backward-compatible script config alias during the Schema migration. */
export type ScriptConfig = ScriptConfigType;

/** Backward-compatible analytics provider name alias during the Schema migration. */
export type AnalyticsProviderName = AnalyticsProviderNameType;

/** Expected analytics failures that callers may recover from. */
export class AnalyticsError extends Data.TaggedError('AnalyticsError')<{
  readonly code:
    | 'ANALYTICS_CONFIG_INVALID'
    | 'ANALYTICS_PROVIDER_UNSUPPORTED'
    | 'ANALYTICS_SCRIPT_INVALID';
  readonly message: string;
}> {}

/** Effect service contract for analytics tracking and browser script config. */
export type AnalyticsService = {
  readonly name: AnalyticsProviderNameType;
  readonly track: (event: TrackEventType) => Effect.Effect<void, AnalyticsError>;
  readonly identify: (
    userId: string,
    traits?: Record<string, string> | undefined,
  ) => Effect.Effect<void, AnalyticsError>;
  readonly getScriptConfig: () => Effect.Effect<ScriptConfigType | null, AnalyticsError>;
};

/** Backward-compatible alias for the analytics service shape during the Effect migration. */
export type AnalyticsProvider = AnalyticsService;
