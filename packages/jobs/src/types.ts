import { Data, type Effect, Schema } from 'effect';
import type { JobsProviderNameType } from './config';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** Provider keys accepted by the jobs resolver. */
export type JobsProviderName = JobsProviderNameType;

/** Payload accepted by jobs adapters. */
export const JobPayload = Schema.Struct({
  name: NonEmptyString,
  data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});

/** Static type inferred from {@link JobPayload}. */
export type JobPayloadType = Schema.Schema.Type<typeof JobPayload>;

/** Payload accepted by jobs adapters. */
export type JobPayload = JobPayloadType;

/** Result returned when a job is accepted by an adapter. */
export const JobSubmission = Schema.Struct({
  id: NonEmptyString,
});

/** Static type inferred from {@link JobSubmission}. */
export type JobSubmissionType = Schema.Schema.Type<typeof JobSubmission>;

/** Tagged failure produced by jobs operations and resolver construction. */
export class JobsError extends Data.TaggedError('JobsError')<{
  readonly code: 'JOBS_CONFIG_INVALID' | 'JOBS_PROVIDER_UNSUPPORTED';
  readonly message: string;
}> {}

/** Background jobs service operations used by templates and maintained packages. */
export type JobsService = {
  readonly name: JobsProviderName;
  readonly enqueue: (job: JobPayload) => Effect.Effect<JobSubmissionType, JobsError>;
  readonly schedule: (job: JobPayload, runAt: Date) => Effect.Effect<JobSubmissionType, JobsError>;
  readonly verifyDelivery: () => Effect.Effect<true, JobsError>;
};

/** Backward-compatible alias for the jobs service contract. */
export type JobsProvider = JobsService;
