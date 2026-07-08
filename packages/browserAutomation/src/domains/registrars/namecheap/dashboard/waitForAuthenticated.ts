import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForRedirectAfterSignIn } from '@vybekiit/browser-automation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isNcAuthenticatedDom } from './authDom';
import { isNcAuthenticatedUrl } from './authUrl';

export { isNcAuthenticatedUrl, NC_AUTH_URL_HINT, NC_AUTHENTICATED_URL } from './authUrl';

/**
 * Wait For Nc Authenticated.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param log - Input value for log.
 * @param context - Browser context used for authenticated waits.
 * @returns Promise resolving with the authenticated page.
 * @example
 * const result = await waitForNcAuthenticated(page, log, context);
 */
export const waitForNcAuthenticated = async (
  page: Page,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
  context?: BrowserContext,
): Promise<Page> =>
  waitForRedirectAfterSignIn(
    page,
    context === undefined ? page.context() : context,
    {
      isAuthenticated: isNcAuthenticatedUrl,
      isAuthenticatedDom: isNcAuthenticatedDom,
      logPrefix: '[nc]',
      prompt:
        'sign-in required — complete login in the browser; automation continues when Namecheap redirects',
      timeoutEnvVar: 'NC_AUTH_TIMEOUT_MS',
    },
    log,
  );
