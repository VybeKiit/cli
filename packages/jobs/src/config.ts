import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** Provider keys accepted by the jobs resolver. */
export const JobsProviderNameSchema = Schema.Literal('cloudflare', 'trigger', 'qstash', 'local');

/** Static type inferred from {@link JobsProviderNameSchema}. */
export type JobsProviderNameType = Schema.Schema.Type<typeof JobsProviderNameSchema>;

/** Runtime config for the jobs provider resolver. */
export const JobsConfigSchema = Schema.Struct({
  JOBS_PROVIDER: Schema.optionalWith(JobsProviderNameSchema, {
    default: () => 'cloudflare' as const,
  }),
});

/** Static type inferred from {@link JobsConfigSchema}. */
export type JobsConfigType = Schema.Schema.Type<typeof JobsConfigSchema>;

/** Cloudflare queue and cron config for the jobs adapter. */
export const CloudflareJobsConfigSchema = Schema.Struct({
  CLOUDFLARE_QUEUE_NAME: Schema.optional(NonEmptyString),
  CLOUDFLARE_CRON_SECRET: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link CloudflareJobsConfigSchema}. */
export type CloudflareJobsConfigType = Schema.Schema.Type<typeof CloudflareJobsConfigSchema>;
