import { Data, type Effect } from 'effect';
import type { KvProviderNameType } from './config';

/** Provider keys accepted by the KV resolver. */
export type KvProviderName = KvProviderNameType;

/** Tagged failure produced by KV operations and resolver construction. */
export class KvError extends Data.TaggedError('KvError')<{
  readonly code:
    | 'KV_CONFIG_INVALID'
    | 'KV_PROVIDER_UNSUPPORTED'
    | 'KV_READ_FAILED'
    | 'KV_WRITE_FAILED'
    | 'KV_DELETE_FAILED';
  readonly message: string;
}> {}

/** Key-value service operations used by templates and maintained packages. */
export type KvService = {
  readonly name: KvProviderName;
  readonly get: (key: string) => Effect.Effect<string | null, KvError>;
  readonly set: (
    key: string,
    value: string,
    ttlSeconds?: number | undefined,
  ) => Effect.Effect<true, KvError>;
  readonly delete: (key: string) => Effect.Effect<true, KvError>;
  readonly verifyDelivery: () => Effect.Effect<true, KvError>;
};

/** Backward-compatible alias for the KV service contract. */
export type KvProvider = KvService;
