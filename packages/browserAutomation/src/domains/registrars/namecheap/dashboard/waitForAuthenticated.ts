import type { BrowserContext, Page } from 'playwright';

import { waitForRedirectAfterSignIn } from '../../../../core/waitForRedirect';
import { isNcAuthenticatedDom } from './authDom';
import { isNcAuthenticatedUrl } from './authUrl';

export { NC_AUTHENTICATED_URL, NC_AUTH_URL_HINT, isNcAuthenticatedUrl } from './authUrl';

export async function waitForNcAuthenticated(
  page: Page,
  log: Pick<Console, 'log' | 'warn'> = console,
  context?: BrowserContext,
): Promise<Page> {
  return waitForRedirectAfterSignIn(
    page,
    context ?? page.context(),
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
}
