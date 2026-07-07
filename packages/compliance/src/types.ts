import { Data, Schema } from 'effect';
import type { ComplianceProviderNameType } from './config';

/** Cookie consent copy and enabled state for generated templates. */
export const CookieConsentConfig = Schema.Struct({
  enabled: Schema.Boolean,
  message: Schema.String,
  acceptLabel: Schema.String,
});

/** Static type inferred from {@link CookieConsentConfig}. */
export type CookieConsentConfigType = Schema.Schema.Type<typeof CookieConsentConfig>;

/** Backward-compatible cookie-consent alias during the Schema migration. */
export type CookieConsentConfig = CookieConsentConfigType;

/** Data export hook paths exposed by the compliance provider. */
export const DataExportHooks = Schema.Struct({
  exportUserData: Schema.String,
});

/** Static type inferred from {@link DataExportHooks}. */
export type DataExportHooksType = Schema.Schema.Type<typeof DataExportHooks>;

/** Backward-compatible data-export hooks alias during the Schema migration. */
export type DataExportHooks = DataExportHooksType;

/** Expected compliance provider failure. */
export class ComplianceError extends Data.TaggedError('ComplianceError')<{
  readonly code: 'COMPLIANCE_CONFIG_INVALID' | 'COMPLIANCE_PROVIDER_UNSUPPORTED';
  readonly message: string;
}> {}

/** Sync service contract for compliance copy and hook locations. */
export type ComplianceService = {
  readonly name: ComplianceProviderNameType;
  readonly cookieConsentConfig: () => CookieConsentConfigType;
  readonly dataExportHooks: () => DataExportHooksType;
};

/** Backward-compatible provider alias while templates migrate to Effect Layer access. */
export type ComplianceProvider = ComplianceService;
