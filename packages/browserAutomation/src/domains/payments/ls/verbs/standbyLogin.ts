import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToLsChrome } from '@vybekiit/browser-automation/domains/payments/ls/connect';
import { waitForLsAuthenticated } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/waitForAuthenticated';
import type { LsVerbContext } from '@vybekiit/browser-automation/domains/payments/ls/types';

export type StandbyLoginResult = {
  readonly ready: boolean;
  readonly url?: string;
};

/**
 * Wait until the builder reaches the Lemon Squeezy dashboard after manual sign-in.
 *
 * @param ctx - Runtime verb context from the CLI.
 * @returns Dashboard readiness and current URL when authenticated.
 * @example
 * const result = await standbyLogin(ctx);
 */
export const standbyLogin = async (ctx: LsVerbContext): Promise<StandbyLoginResult> => {
  const session = await connectToLsChrome(ctx, { waitForAuth: false });

  try {
    try {
      const log = resolveVerbLogger(ctx);
      session.page = await waitForLsAuthenticated(session.page, log, session.context);
      return { ready: session.page.url().includes('/dashboard'), url: session.page.url() };
    } catch {
      return { ready: false };
    }
  } finally {
    await session.dispose();
  }
};
