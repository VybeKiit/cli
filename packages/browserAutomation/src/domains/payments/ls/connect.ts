import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browser-automation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browser-automation/core/types';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForLsAuthenticated } from './dashboard/waitForAuthenticated';
import { LS_DASHBOARD_URL, type LsVerbContext } from './types';

// `https://app.lemonsqueezy.com/dashboard` -> match.
const LEMON_SQUEEZY_TAB_URL_PATTERN = /lemonsqueezy\.com/i;

export type ConnectToLsChromeOptions = {
  /** When true (default), pause on login/OAuth until the dashboard is reachable. */
  readonly waitForAuth?: boolean;
};

/**
 * Connect to the Lemon Squeezy dashboard with a remembered Chrome profile.
 *
 * @param ctx - Runtime verb context from the CLI.
 * @param options - Login wait options for the dashboard session.
 * @returns Attached Chrome session for Lemon Squeezy automation.
 * @example
 * const session = await connectToLsChrome(ctx, { waitForAuth: true });
 */
export const connectToLsChrome = async (
  ctx: LsVerbContext,
  options: ConnectToLsChromeOptions = {},
): Promise<AttachedSession> => {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('ls', ctx.profilePath);
  await rememberProfilePath('ls', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: LS_DASHBOARD_URL,
    tabUrlPattern: LEMON_SQUEEZY_TAB_URL_PATTERN,
  });
  if (waitForAuth) {
    const log = resolveVerbLogger(ctx);
    session.page = await waitForLsAuthenticated(session.page, log, session.context);
  }
  return session;
};
