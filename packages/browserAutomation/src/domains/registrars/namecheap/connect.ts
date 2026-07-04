import { connectToChrome } from '@vybekiit/browserAutomation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browserAutomation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browserAutomation/core/types';
import { waitForNcAuthenticated } from './dashboard/waitForAuthenticated';
import { NC_API_ACCESS_URL, type NcVerbContext } from './types';

export type ConnectToNcChromeOptions = {
  waitForAuth?: boolean;
};

export async function connectToNcChrome(
  ctx: NcVerbContext,
  options: ConnectToNcChromeOptions = {},
): Promise<AttachedSession> {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('namecheap', ctx.profilePath);
  await rememberProfilePath('namecheap', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: NC_API_ACCESS_URL,
    tabUrlPattern: /namecheap\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForNcAuthenticated(session.page, ctx.log ?? console, session.context);
  }
  return session;
}
