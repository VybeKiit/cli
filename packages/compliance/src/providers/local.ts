import type { ComplianceConfigType } from '@vybekiit/compliance/config';
import type { ComplianceService } from '@vybekiit/compliance/types';

const COOKIE_CONSENT_MESSAGE = 'We use cookies to improve your experience.';
const COOKIE_CONSENT_ACCEPT_LABEL = 'Accept';
const USER_DATA_EXPORT_PATH = '/api/account/export';

/**
 * Build the local cookie-consent config from parsed compliance config.
 *
 * @param config - Parsed compliance config.
 * @returns Cookie-consent config for generated templates.
 * @example
 * const consent = createCookieConsentConfig({ COOKIE_CONSENT_ENABLED: 'on' });
 */
const createCookieConsentConfig = (
  config: ComplianceConfigType,
): ReturnType<ComplianceService['cookieConsentConfig']> => ({
  enabled: config.COOKIE_CONSENT_ENABLED === 'on',
  message: COOKIE_CONSENT_MESSAGE,
  acceptLabel: COOKIE_CONSENT_ACCEPT_LABEL,
});

/**
 * Build local data-export hook paths.
 *
 * @returns Data-export hook paths for generated templates.
 * @example
 * const hooks = createDataExportHooks();
 */
const createDataExportHooks = (): ReturnType<ComplianceService['dataExportHooks']> => ({
  exportUserData: USER_DATA_EXPORT_PATH,
});

/**
 * Create the local compliance provider.
 *
 * @param config - Parsed compliance config.
 * @returns Local compliance provider adapter.
 * @example
 * const compliance = createLocalCompliance({ COOKIE_CONSENT_ENABLED: 'on' });
 */
export const createLocalCompliance = (config: ComplianceConfigType): ComplianceService => ({
  name: 'local',
  cookieConsentConfig: () => createCookieConsentConfig(config),
  dataExportHooks: createDataExportHooks,
});
