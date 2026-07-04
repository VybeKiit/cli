import type { ComplianceProvider } from '@vybekiit/compliance/types';
import type { ComplianceConfig } from '@vybekiit/core';

export function createLocalCompliance(config: ComplianceConfig): ComplianceProvider {
  return {
    name: 'local',
    cookieConsentConfig() {
      return {
        enabled: config.COOKIE_CONSENT_ENABLED === 'on',
        message: 'We use cookies to improve your experience.',
        acceptLabel: 'Accept',
      };
    },
    dataExportHooks() {
      return { exportUserData: '/api/account/export' };
    },
  };
}
