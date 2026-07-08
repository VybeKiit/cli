import { Data, type Effect, Schema } from 'effect';

/** Provider keys accepted by the realtime resolver. */
export const RealtimeProviderName = Schema.Literal('supabase', 'cloudflare-do', 'local');

/** Payload delivered across realtime channels. */
export const RealtimePayload = Schema.Record({ key: Schema.String, value: Schema.Unknown });

/** Static type inferred from {@link RealtimeProviderName}. */
export type RealtimeProviderNameType = Schema.Schema.Type<typeof RealtimeProviderName>;

/** Static type inferred from {@link RealtimePayload}. */
export type RealtimePayloadType = Schema.Schema.Type<typeof RealtimePayload>;

/** Provider keys accepted by the realtime resolver. */
export type RealtimeProviderName = RealtimeProviderNameType;

/** Payload delivered across realtime channels. */
export type RealtimePayload = RealtimePayloadType;

/** Callback invoked for each local realtime payload. */
export type RealtimeHandler = (payload: RealtimePayload) => void;

/** The tagged failure a realtime operation can produce (ADR-0023). */
export class RealtimeError extends Data.TaggedError('RealtimeError')<{
  readonly code:
    | 'REALTIME_CONFIG_INVALID'
    | 'REALTIME_PROVIDER_UNSUPPORTED'
    | 'REALTIME_PUBLISH_FAILED';
  readonly message: string;
}> {}

/** A publish-subscribe channel for realtime messages. */
export type RealtimeChannel = {
  readonly subscribe: (handler: RealtimeHandler) => void;
  readonly publish: (payload: RealtimePayload) => Effect.Effect<void, RealtimeError>;
  readonly unsubscribe: () => void;
};

/** Realtime provider contract used by live-update features. */
export type RealtimeService = {
  readonly name: RealtimeProviderName;
  readonly channel: (name: string) => RealtimeChannel;
};

/** Backward-compatible alias for the realtime service contract. */
export type RealtimeProvider = RealtimeService;
