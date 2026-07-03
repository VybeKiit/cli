import { connectToChrome } from '@vybekiit/browserAutomation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browserAutomation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browserAutomation/core/types';
import { waitForGoogleAuthenticated } from './dashboard/waitForAuthenticated';
import { GOOGLE_CONSOLE_URL, type GoogleVerbContext } from './types';

export interface ConnectToGoogleChromeOptions {
  waitForAuth?: boolean;
  /** Console URL to open (project-scoped consent/clients page); defaults to the console home. */
  startUrl?: string;
}

/** Attach to the dedicated Google Chrome profile, reusing an open Console tab when present. */
export async function connectToGoogleChrome(
  ctx: GoogleVerbContext,
  options: ConnectToGoogleChromeOptions = {},
): Promise<AttachedSession> {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('google', ctx.profilePath);
  await rememberProfilePath('google', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: options.startUrl ?? GOOGLE_CONSOLE_URL,
    tabUrlPattern: /console\.cloud\.google\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForGoogleAuthenticated(
      session.page,
      ctx.log ?? console,
      session.context,
    );
  }
  return session;
}
