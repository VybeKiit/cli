import { connectToChrome } from '../../../core/connect';
import { rememberProfilePath, resolveProfilePath } from '../../../core/profileResolve';
import type { AttachedSession } from '../../../core/types';
import { waitForGdAuthenticated } from './dashboard/waitForAuthenticated';
import { GD_KEYS_URL, type GdVerbContext } from './types';

export type ConnectToGdChromeOptions = {
  waitForAuth?: boolean;
};

export async function connectToGdChrome(
  ctx: GdVerbContext,
  options: ConnectToGdChromeOptions = {},
): Promise<AttachedSession> {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('godaddy', ctx.profilePath);
  await rememberProfilePath('godaddy', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: GD_KEYS_URL,
    tabUrlPattern: /godaddy\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForGdAuthenticated(session.page, ctx.log ?? console, session.context);
  }
  return session;
}
