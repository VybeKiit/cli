import { connectToLsChrome } from '../connect';
import { waitForLsAuthenticated } from '../dashboard/waitForAuthenticated';
import type { LsVerbContext } from '../types';

/** Wait until builder reaches the LS dashboard after manual sign-in. */
export async function standbyLogin(ctx: LsVerbContext): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToLsChrome(ctx, { waitForAuth: false });

  try {
    try {
      session.page = await waitForLsAuthenticated(
        session.page,
        ctx.log ?? console,
        session.context,
      );
      return { ready: session.page.url().includes('/dashboard'), url: session.page.url() };
    } catch {
      return { ready: false };
    }
  } finally {
    await session.dispose();
  }
}
