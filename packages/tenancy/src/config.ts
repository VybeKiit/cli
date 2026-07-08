import { Schema } from 'effect';

/** Runtime config for the tenancy provider resolver. */
export const TenancyConfigSchema = Schema.Struct({
  TENANCY_PROVIDER: Schema.optionalWith(Schema.Literal('better-auth', 'local'), {
    default: () => 'better-auth' as const,
  }),
});

/** Static type inferred from {@link TenancyConfigSchema}. */
export type TenancyConfigType = Schema.Schema.Type<typeof TenancyConfigSchema>;

/** Backward-compatible alias for the tenancy config shape. */
export type TenancyConfig = TenancyConfigType;
