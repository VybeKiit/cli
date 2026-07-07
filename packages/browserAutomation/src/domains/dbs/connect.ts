import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browser-automation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browser-automation/core/types';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForSupabaseAuthenticated } from './dashboard/waitForAuthenticated';
import { SUPABASE_DASHBOARD_URL, type SupabaseVerbContext } from './types';

export type ConnectToSupabaseChromeOptions = {
  /** When true (default), pause on login until the dashboard is reachable. */
  waitForAuth?: boolean;
};

/**
 * Connect To Supabase Chrome.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param options - Operation options.
 * @returns Promise resolving with an attached browser session.
 * @example
 * const result = await connectToSupabaseChrome(ctx, options);
 */
export const connectToSupabaseChrome = async (
  ctx: SupabaseVerbContext,
  options: ConnectToSupabaseChromeOptions = {},
): Promise<AttachedSession> => {
  const waitForAuth = options.waitForAuth !== false;
  const profilePath = await resolveProfilePath('supabase', ctx.profilePath);
  await rememberProfilePath('supabase', profilePath);

  const session = await connectToChrome({
    ...ctx,
    profileHint: profilePath,
    startUrl: SUPABASE_DASHBOARD_URL,
    tabUrlPattern: /supabase\.com/i,
  });
  if (waitForAuth) {
    session.page = await waitForSupabaseAuthenticated(
      session.page,
      resolveVerbLogger(ctx),
      session.context,
    );
  }
  return session;
};
