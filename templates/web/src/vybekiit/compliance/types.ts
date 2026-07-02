export type ComplianceProviderName = 'local';

export interface CookieConsentConfig {
  readonly enabled: boolean;
  readonly message: string;
  readonly acceptLabel: string;
}

export interface ComplianceProvider {
  readonly name: ComplianceProviderName;
  cookieConsentConfig(): CookieConsentConfig;
  dataExportHooks(): { readonly exportUserData: string };
}
