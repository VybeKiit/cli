import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browser-automation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browser-automation/core/types';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForGdAuthenticated } from './dashboard/waitForAuthenticated';
import { GD_KEYS_URL, type GdVerbContext } from './types';

export type ConnectToGdChromeOptions = {
  waitForAuth?: boolean;
};

/**
 * Connect To Gd Chrome.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param options - Operation options.
 * @returns Promise resolving with an attached browser session.
 * @example
 * const result = await connectToGdChrome(ctx, options);
 */
export const connectToGdChrome = async (
  ctx: GdVerbContext,
  options: ConnectToGdChromeOptions = {},
): Promise<AttachedSession> => {
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
    session.page = await waitForGdAuthenticated(
      session.page,
      resolveVerbLogger(ctx),
      session.context,
    );
  }
  return session;
};
