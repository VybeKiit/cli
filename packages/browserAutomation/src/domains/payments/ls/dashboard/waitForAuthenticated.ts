import { waitForRedirectAfterSignIn } from '@vybekiit/browserAutomation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isLsAuthenticatedDom } from './authDom';
import { isLsAuthenticatedUrl } from './authUrl';

export {
  isLsAuthenticatedUrl,
  isLsAuthGateUrl,
  LS_AUTH_URL_HINT,
  LS_AUTHENTICATED_URL,
} from './authUrl';

export type WaitForLsAuthOptions = {
  timeoutMs?: number;
};

export async function waitForLsAuthenticated(
  page: Page,
  log: Pick<Console, 'log' | 'warn'> = console,
  context?: BrowserContext,
  _options?: WaitForLsAuthOptions,
): Promise<Page> {
  return waitForRedirectAfterSignIn(
    page,
    context ?? page.context(),
    {
      isAuthenticated: isLsAuthenticatedUrl,
      isAuthenticatedDom: isLsAuthenticatedDom,
      logPrefix: '[ls]',
      prompt:
        'sign-in required — complete login in the browser; automation continues when the dashboard loads',
      timeoutEnvVar: 'LS_AUTH_TIMEOUT_MS',
    },
    log,
  );
}
