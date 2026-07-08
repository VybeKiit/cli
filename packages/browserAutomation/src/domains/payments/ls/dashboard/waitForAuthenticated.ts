import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForRedirectAfterSignIn } from '@vybekiit/browser-automation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isLsAuthenticatedDom } from './authDom';
import { isLsAuthenticatedUrl } from './authUrl';

export type WaitForLsAuthOptions = {
  readonly timeoutMs?: number;
};

/**
 * Wait until Lemon Squeezy reaches an authenticated dashboard page.
 *
 * @param page - Current Lemon Squeezy page.
 * @param log - Logger used for auth prompts and timeout messages.
 * @param context - Browser context to watch for auth redirects.
 * @param _options - Reserved auth wait options.
 * @returns Authenticated page to continue automating.
 * @example
 * const page = await waitForLsAuthenticated(session.page, console, session.context);
 */
export const waitForLsAuthenticated = (
  page: Page,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
  context?: BrowserContext,
  _options?: WaitForLsAuthOptions,
): Promise<Page> => {
  const browserContext = context === undefined ? page.context() : context;

  return waitForRedirectAfterSignIn(
    page,
    browserContext,
    {
      isAuthenticated: isLsAuthenticatedUrl,
      isAuthenticatedDom: isLsAuthenticatedDom,
      logPrefix: '[ls]',
      prompt:
        'sign-in required - complete login in the browser; automation continues when the dashboard loads',
      timeoutEnvVar: 'LS_AUTH_TIMEOUT_MS',
    },
    log,
  );
};
