import type { BrowserContext, Page } from 'playwright';

import { waitForRedirectAfterSignIn } from '../../../../core/waitForRedirect';
import { isGdAuthenticatedDom } from './authDom';
import { isGdAuthenticatedUrl } from './authUrl';

export { GD_AUTHENTICATED_URL, GD_AUTH_URL_HINT, isGdAuthenticatedUrl } from './authUrl';

export async function waitForGdAuthenticated(
  page: Page,
  log: Pick<Console, 'log' | 'warn'> = console,
  context?: BrowserContext,
): Promise<Page> {
  return waitForRedirectAfterSignIn(
    page,
    context ?? page.context(),
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
}
