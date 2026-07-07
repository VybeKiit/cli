import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browser-automation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browser-automation/core/types';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForGoogleAuthenticated } from './dashboard/waitForAuthenticated';
import { GOOGLE_CONSOLE_URL, type GoogleVerbContext } from './types';

export type ConnectToGoogleChromeOptions = {
  waitForAuth?: boolean;
  /** Console URL to open (project-scoped consent/clients page); defaults to the console home. */
  startUrl?: string;
};

/**
 * Attach to the dedicated Google Chrome profile, reusing an open Console tab when present.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param options - Operation options.
 * @returns Promise resolving with an attached browser session.
 * @example
 * const result = await connectToGoogleChrome(ctx, options);
 */
export const connectToGoogleChrome = async (
  ctx: GoogleVerbContext,
  options: ConnectToGoogleChromeOptions = {},
): Promise<AttachedSession> => {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('google', ctx.profilePath);
  await rememberProfilePath('google', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: options.startUrl === undefined ? GOOGLE_CONSOLE_URL : options.startUrl,
    tabUrlPattern: /console\.cloud\.google\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForGoogleAuthenticated(
      session.page,
      resolveVerbLogger(ctx),
      session.context,
    );
  }
  return session;
};
