import { Schema } from 'effect';

/** Compliance provider selector decoded from environment config. */
export const ComplianceProviderName = Schema.Literal('local');

/** Static type inferred from {@link ComplianceProviderName}. */
export type ComplianceProviderNameType = Schema.Schema.Type<typeof ComplianceProviderName>;

/** Backward-compatible provider-name alias during the Schema migration. */
export type ComplianceProviderName = ComplianceProviderNameType;

/** Compliance provider config slice. */
export const ComplianceConfig = Schema.Struct({
  COMPLIANCE_PROVIDER: Schema.optionalWith(ComplianceProviderName, {
    default: () => 'local' as const,
  }),
  COOKIE_CONSENT_ENABLED: Schema.optionalWith(Schema.Literal('on', 'off'), {
    default: () => 'on' as const,
  }),
});

/** Static type inferred from {@link ComplianceConfig}. */
export type ComplianceConfigType = Schema.Schema.Type<typeof ComplianceConfig>;
