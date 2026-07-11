import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForRedirectAfterSignIn } from '@vybekiit/browser-automation/core/waitForRedirect';
import type { BrowserContext, Page } from 'playwright';
import { isGoogleAuthenticatedDom } from './authDom';
import { isGoogleAuthenticatedUrl } from './authUrl';

/**
 * Block until the builder finishes Google sign-in and a Console tab is authenticated.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param log - Input value for log.
 * @param context - Browser context used for authenticated waits.
 * @returns Promise resolving with the authenticated page.
 * @example
 * const result = await waitForGoogleAuthenticated(page, log, context);
 */
export const waitForGoogleAuthenticated = async (
  page: Page,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
  context?: BrowserContext,
): Promise<Page> =>
  waitForRedirectAfterSignIn(
    page,
    context === undefined ? page.context() : context,
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
