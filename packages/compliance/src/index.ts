export type { ComplianceProvider, ComplianceProviderName, CookieConsentConfig } from './types';
export { createComplianceFromEnv, resolveComplianceProvider } from './resolve';
export { createLocalCompliance } from './providers/local';
