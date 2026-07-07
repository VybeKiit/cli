import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browser-automation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browser-automation/core/types';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForNcAuthenticated } from './dashboard/waitForAuthenticated';
import { NC_API_ACCESS_URL, type NcVerbContext } from './types';

export type ConnectToNcChromeOptions = {
  waitForAuth?: boolean;
};

/**
 * Connect To Nc Chrome.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param options - Operation options.
 * @returns Promise resolving with an attached browser session.
 * @example
 * const result = await connectToNcChrome(ctx, options);
 */
export const connectToNcChrome = async (
  ctx: NcVerbContext,
  options: ConnectToNcChromeOptions = {},
): Promise<AttachedSession> => {
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
    session.page = await waitForNcAuthenticated(
      session.page,
      resolveVerbLogger(ctx),
      session.context,
    );
  }
  return session;
};
