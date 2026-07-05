import { connectToChrome } from '@vybekiit/browserAutomation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browserAutomation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browserAutomation/core/types';
import { waitForCfAuthenticated } from './dashboard/waitForAuthenticated';
import { CF_DASHBOARD_URL, type CfVerbContext } from './types';

export interface ConnectToCfChromeOptions {
  /** When true (default), pause on login until the dashboard is reachable. */
  waitForAuth?: boolean;
}

export async function connectToCfChrome(
  ctx: CfVerbContext,
  options: ConnectToCfChromeOptions = {},
): Promise<AttachedSession> {
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
      ctx.log ?? console,
      session.context,
    );
  }
  return session;
}
