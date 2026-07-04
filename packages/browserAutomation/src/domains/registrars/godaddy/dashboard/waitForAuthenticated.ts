import { waitForRedirectAfterSignIn } from '@vybekiit/browserAutomation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isGdAuthenticatedDom } from './authDom';
import { isGdAuthenticatedUrl } from './authUrl';

export { GD_AUTH_URL_HINT, GD_AUTHENTICATED_URL, isGdAuthenticatedUrl } from './authUrl';

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
