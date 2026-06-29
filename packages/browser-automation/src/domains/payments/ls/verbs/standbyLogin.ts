import { connectToLsChrome } from '../connect';
import { LS_DASHBOARD_URL, type LsVerbContext } from '../types';

const AUTH_TIMEOUT_MS = 120_000;

/** Wait until builder reaches the LS dashboard after manual sign-in. */
export async function standbyLogin(ctx: LsVerbContext): Promise<{ ready: boolean; url?: string }> {
  const log = ctx.log ?? console;
  const session = await connectToLsChrome(ctx);

  try {
    log.log(`[ls] waiting for dashboard at ${LS_DASHBOARD_URL}`);
    await session.page.waitForURL(/lemonsqueezy\.com\/dashboard/, {
      timeout: AUTH_TIMEOUT_MS,
    });
    const url = session.page.url();
    return { ready: url.includes('/dashboard'), url };
  } catch {
    return { ready: false };
  } finally {
    await session.dispose();
  }
}
