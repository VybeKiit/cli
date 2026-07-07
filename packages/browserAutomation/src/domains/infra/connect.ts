import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browser-automation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browser-automation/core/types';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForCfAuthenticated } from './dashboard/waitForAuthenticated';
import { CF_DASHBOARD_URL, type CfVerbContext } from './types';

export type ConnectToCfChromeOptions = {
  /** When true (default), pause on login until the dashboard is reachable. */
  waitForAuth?: boolean;
};

/**
 * Connect To Cf Chrome.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param options - Operation options.
 * @returns Promise resolving with an attached browser session.
 * @example
 * const result = await connectToCfChrome(ctx, options);
 */
export const connectToCfChrome = async (
  ctx: CfVerbContext,
  options: ConnectToCfChromeOptions = {},
): Promise<AttachedSession> => {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('cloudflare', ctx.profilePath);
  await rememberProfilePath('cloudflare', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: CF_DASHBOARD_URL,
    tabUrlPattern: /dash\.cloudflare\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForCfAuthenticated(
      session.page,
      resolveVerbLogger(ctx),
      session.context,
    );
  }
  return session;
};
