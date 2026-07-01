import { connectToGdChrome } from '../connect';
import { waitForGdAuthenticated } from '../dashboard/waitForAuthenticated';
import type { GdSetupParams, GdSetupResult, GdVerbContext } from '../types';
import { createApiKeyInPortal } from './createApiKey';

export async function standbyLogin(
  ctx: GdVerbContext = {},
): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToGdChrome(ctx, { waitForAuth: false });

  try {
    try {
      session.page = await waitForGdAuthenticated(
        session.page,
        ctx.log ?? console,
        session.context,
      );
      return { ready: true, url: session.page.url() };
    } catch {
      return { ready: false };
    }
  } finally {
    await session.dispose();
  }
}

export async function runGdSetup(
  ctx: GdVerbContext,
  params: GdSetupParams,
): Promise<GdSetupResult> {
  const session = await connectToGdChrome(ctx);
  try {
    return await createApiKeyInPortal(session.page, params, session.context, ctx.log ?? console);
  } finally {
    await session.dispose();
  }
}
