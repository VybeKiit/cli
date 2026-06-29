import { connectToChrome } from '../../../core/connect';
import { PROFILE_PATHS, type AttachedSession } from '../../../core/types';
import { LS_DASHBOARD_URL, type LsVerbContext } from './types';

export async function connectToLsChrome(ctx: LsVerbContext): Promise<AttachedSession> {
  const session = await connectToChrome({
    ...ctx,
    profileHint: PROFILE_PATHS.ls,
  });
  await session.page.goto(LS_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
  return session;
}
