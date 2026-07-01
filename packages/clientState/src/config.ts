import { Schema } from 'effect';

/**
 * Client-state configuration — Effect Schema (ADR-0023). Parsed via core's `parseEnv`;
 * the root `.env.example` stays the single source of truth for the keys. Structurally
 * identical to the zod `clientStateConfigSchema` core shipped before.
 */

/**
 * A positive integer read from an env string. Blank or absent means the fallback — a
 * non-coder who leaves the line empty in a copied `.env` gets the safe default rather
 * than a boot failure (mirrors core's old `positiveIntEnv`).
 */
const positiveIntEnv = (fallback: number) =>
  Schema.optionalWith(
    Schema.transform(Schema.String, Schema.Number.pipe(Schema.int(), Schema.positive()), {
      strict: true,
      decode: (value) => (value === '' ? fallback : Number(value)),
      encode: (value) => String(value),
    }),
    { default: () => fallback },
  );

/** Client-side cache + UI prefs — `@vybekiit/client-state`. */
export const ClientStateConfigSchema = Schema.Struct({
  CLIENT_STATE_PERSIST: Schema.optionalWith(Schema.Literal('on', 'off'), {
    default: () => 'on' as const,
  }),
  CLIENT_STATE_QUERY_STALE_SECONDS: positiveIntEnv(60),
});
export type ClientStateConfig = Schema.Schema.Type<typeof ClientStateConfigSchema>;
