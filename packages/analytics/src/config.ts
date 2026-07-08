import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

/** Supported analytics adapter keys decoded from `ANALYTICS_PROVIDER`. */
export const AnalyticsProviderNameSchema = Schema.Literal('local', 'plausible', 'posthog');

/** Static type inferred from {@link AnalyticsProviderNameSchema}. */
export type AnalyticsProviderNameType = Schema.Schema.Type<typeof AnalyticsProviderNameSchema>;

/** Analytics provider selector config. */
export const AnalyticsConfigSchema = Schema.Struct({
  ANALYTICS_PROVIDER: Schema.optionalWith(AnalyticsProviderNameSchema, {
    default: () => 'local' as const,
  }),
});

/** Static type inferred from {@link AnalyticsConfigSchema}. */
export type AnalyticsConfigType = Schema.Schema.Type<typeof AnalyticsConfigSchema>;

/** Plausible credentials and script host config. */
export const PlausibleConfigSchema = Schema.Struct({
  PLAUSIBLE_DOMAIN: NonEmptyString,
  PLAUSIBLE_API_HOST: Schema.optional(UrlString),
});

/** Static type inferred from {@link PlausibleConfigSchema}. */
export type PlausibleConfigType = Schema.Schema.Type<typeof PlausibleConfigSchema>;

/** PostHog credentials and script host config. */
export const PosthogConfigSchema = Schema.Struct({
  POSTHOG_API_KEY: NonEmptyString,
  POSTHOG_HOST: Schema.optional(UrlString),
});

/** Static type inferred from {@link PosthogConfigSchema}. */
export type PosthogConfigType = Schema.Schema.Type<typeof PosthogConfigSchema>;
