import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForRedirectAfterSignIn } from '@vybekiit/browser-automation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isGdAuthenticatedDom } from './authDom';
import { isGdAuthenticatedUrl } from './authUrl';

export { GD_AUTH_URL_HINT, GD_AUTHENTICATED_URL, isGdAuthenticatedUrl } from './authUrl';

/**
 * Wait For Gd Authenticated.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param log - Input value for log.
 * @param context - Browser context used for authenticated waits.
 * @returns Promise resolving with the authenticated page.
 * @example
 * const result = await waitForGdAuthenticated(page, log, context);
 */
export const waitForGdAuthenticated = async (
  page: Page,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
  context?: BrowserContext,
): Promise<Page> =>
  waitForRedirectAfterSignIn(
    page,
    context === undefined ? page.context() : context,
    {
      isAuthenticated: isGdAuthenticatedUrl,
      isAuthenticatedDom: isGdAuthenticatedDom,
      logPrefix: '[gd]',
      prompt:
        'sign-in required — complete login in the browser; automation continues when GoDaddy Developer redirects',
      timeoutEnvVar: 'GD_AUTH_TIMEOUT_MS',
    },
    log,
  );
