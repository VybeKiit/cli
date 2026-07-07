import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToGdChrome } from '@vybekiit/browser-automation/domains/registrars/godaddy/connect';
import { waitForGdAuthenticated } from '@vybekiit/browser-automation/domains/registrars/godaddy/dashboard/waitForAuthenticated';
import type {
  GdSetupParams,
  GdSetupResult,
  GdVerbContext,
} from '@vybekiit/browser-automation/domains/registrars/godaddy/types';
import { createApiKeyInPortal } from './createApiKey';

/**
 * Standby Login.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await standbyLogin(ctx);
 */
export const standbyLogin = async (
  ctx: GdVerbContext = {},
): Promise<{ ready: boolean; url?: string }> => {
  const session = await connectToGdChrome(ctx, { waitForAuth: false });

  try {
    try {
      session.page = await waitForGdAuthenticated(
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
 * Run Gd Setup.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param params - Validated automation parameters for the operation.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await runGdSetup(ctx, params);
 */
export const runGdSetup = async (
  ctx: GdVerbContext,
  params: GdSetupParams,
): Promise<GdSetupResult> => {
  const session = await connectToGdChrome(ctx);
  try {
    return await createApiKeyInPortal(
      session.page,
      params,
      session.context,
      resolveVerbLogger(ctx),
    );
  } finally {
    await session.dispose();
  }
};
