import { connectToLsChrome } from '@vybekiit/browserAutomation/domains/payments/ls/connect';
import { waitForLsAuthenticated } from '@vybekiit/browserAutomation/domains/payments/ls/dashboard/waitForAuthenticated';
import type { LsVerbContext } from '@vybekiit/browserAutomation/domains/payments/ls/types';

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
