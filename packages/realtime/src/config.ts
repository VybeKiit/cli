import { Schema } from 'effect';

/** Runtime config for the realtime provider resolver. */
export const RealtimeConfigSchema = Schema.Struct({
  REALTIME_PROVIDER: Schema.optionalWith(Schema.Literal('supabase', 'cloudflare-do', 'local'), {
    default: () => 'local' as const,
  }),
});

/** Static type inferred from {@link RealtimeConfigSchema}. */
export type RealtimeConfigType = Schema.Schema.Type<typeof RealtimeConfigSchema>;

/** Backward-compatible alias for the realtime config shape. */
export type RealtimeConfig = RealtimeConfigType;
