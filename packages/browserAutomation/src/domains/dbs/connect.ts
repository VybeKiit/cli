import { connectToChrome } from '@vybekiit/browserAutomation/core/connect';
import {
  rememberProfilePath,
  resolveProfilePath,
} from '@vybekiit/browserAutomation/core/profileResolve';
import type { AttachedSession } from '@vybekiit/browserAutomation/core/types';
import { waitForSupabaseAuthenticated } from './dashboard/waitForAuthenticated';
import { SUPABASE_DASHBOARD_URL, type SupabaseVerbContext } from './types';

export interface ConnectToSupabaseChromeOptions {
  /** When true (default), pause on login until the dashboard is reachable. */
  waitForAuth?: boolean;
}

export async function connectToSupabaseChrome(
  ctx: SupabaseVerbContext,
  options: ConnectToSupabaseChromeOptions = {},
): Promise<AttachedSession> {
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
      ctx.log ?? console,
      session.context,
    );
  }
  return session;
}
