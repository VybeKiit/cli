import { connectToChrome } from '../../../core/connect';
import { rememberProfilePath, resolveProfilePath } from '../../../core/profileResolve';
import type { AttachedSession } from '../../../core/types';
import { waitForLsAuthenticated } from './dashboard/waitForAuthenticated';
import { LS_DASHBOARD_URL, type LsVerbContext } from './types';

export type ConnectToLsChromeOptions = {
  /** When true (default), pause on login/OAuth until the dashboard is reachable. */
  waitForAuth?: boolean;
};

export async function connectToLsChrome(
  ctx: LsVerbContext,
  options: ConnectToLsChromeOptions = {},
): Promise<AttachedSession> {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('ls', ctx.profilePath);
  await rememberProfilePath('ls', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: LS_DASHBOARD_URL,
    tabUrlPattern: /lemonsqueezy\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForLsAuthenticated(session.page, ctx.log ?? console, session.context);
  }
  return session;
}
