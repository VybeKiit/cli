import { waitForRedirectAfterSignIn } from '@vybekiit/browserAutomation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isGoogleAuthenticatedDom } from './authDom';
import { isGoogleAuthenticatedUrl } from './authUrl';

export { isGoogleAuthenticatedUrl } from './authUrl';

/** Block until the builder finishes Google sign-in and a Console tab is authenticated. */
export async function waitForGoogleAuthenticated(
  page: Page,
  log: Pick<Console, 'log' | 'warn'> = console,
  context?: BrowserContext,
): Promise<Page> {
  return waitForRedirectAfterSignIn(
    page,
    context ?? page.context(),
    {
      isAuthenticated: isGoogleAuthenticatedUrl,
      isAuthenticatedDom: isGoogleAuthenticatedDom,
      logPrefix: '[google]',
      prompt:
        'sign-in required — sign in to Google in the browser; automation continues when the Console loads',
      timeoutEnvVar: 'GOOGLE_AUTH_TIMEOUT_MS',
    },
    log,
  );
}
