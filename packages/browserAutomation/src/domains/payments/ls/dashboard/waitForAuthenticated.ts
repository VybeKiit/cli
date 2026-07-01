import type { BrowserContext, Page } from 'playwright';

import { waitForRedirectAfterSignIn } from '../../../../core/waitForRedirect';
import { isLsAuthenticatedDom } from './authDom';
import { isLsAuthenticatedUrl } from './authUrl';

export {
  LS_AUTHENTICATED_URL,
  LS_AUTH_URL_HINT,
  isLsAuthGateUrl,
  isLsAuthenticatedUrl,
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
