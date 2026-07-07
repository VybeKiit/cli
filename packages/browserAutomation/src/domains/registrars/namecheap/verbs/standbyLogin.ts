import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToNcChrome } from '@vybekiit/browser-automation/domains/registrars/namecheap/connect';
import { waitForNcAuthenticated } from '@vybekiit/browser-automation/domains/registrars/namecheap/dashboard/waitForAuthenticated';
import type {
  NcSetupParams,
  NcSetupResult,
  NcVerbContext,
} from '@vybekiit/browser-automation/domains/registrars/namecheap/types';
import { setupApiAccess } from './setupApiAccess';

/**
 * Wait until builder reaches Namecheap after manual sign-in.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await standbyLogin(ctx);
 */
export const standbyLogin = async (
  ctx: NcVerbContext = {},
): Promise<{ ready: boolean; url?: string }> => {
  const session = await connectToNcChrome(ctx, { waitForAuth: false });

  try {
    try {
      session.page = await waitForNcAuthenticated(
        session.page,
        resolveVerbLogger(ctx),
        session.context,
      );
      return { ready: true, url: session.page.url() };
    } catch {
      return { ready: false };
    }
  } finally {
    await session.dispose();
  }
};

/**
 * Run Nc Setup.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param params - Validated automation parameters for the operation.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await runNcSetup(ctx, params);
 */
export const runNcSetup = async (
  ctx: NcVerbContext,
  params: NcSetupParams = {},
): Promise<NcSetupResult> => {
  const session = await connectToNcChrome(ctx);
  try {
    return await setupApiAccess(session.page, params, session.context, resolveVerbLogger(ctx));
  } finally {
    await session.dispose();
  }
};
