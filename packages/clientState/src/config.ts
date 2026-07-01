import { onOff, positiveIntEnv } from '@vybekiit/core';
import { Schema } from 'effect';

/**
 * Client-state configuration — Effect Schema (ADR-0023). Parsed via core's `parseEnv`;
 * the root `.env.example` is the single source of truth for the keys. The shared
 * `onOff` / `positiveIntEnv` primitives come from `@vybekiit/core` (one SSOT, not copied).
 */
export const ClientStateConfigSchema = Schema.Struct({
  CLIENT_STATE_PERSIST: Schema.optionalWith(onOff, { default: () => 'on' as const }),
  CLIENT_STATE_QUERY_STALE_SECONDS: positiveIntEnv(60),
});
export type ClientStateConfig = Schema.Schema.Type<typeof ClientStateConfigSchema>;
