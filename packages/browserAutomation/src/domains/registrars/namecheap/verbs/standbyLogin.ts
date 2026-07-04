import { connectToNcChrome } from '@vybekiit/browserAutomation/domains/registrars/namecheap/connect';
import { waitForNcAuthenticated } from '@vybekiit/browserAutomation/domains/registrars/namecheap/dashboard/waitForAuthenticated';
import type {
  NcSetupParams,
  NcSetupResult,
  NcVerbContext,
} from '@vybekiit/browserAutomation/domains/registrars/namecheap/types';
import { setupApiAccess } from './setupApiAccess';

/** Wait until builder reaches Namecheap after manual sign-in. */
export async function standbyLogin(
  ctx: NcVerbContext = {},
): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToNcChrome(ctx, { waitForAuth: false });

  try {
    try {
      session.page = await waitForNcAuthenticated(
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

export async function runNcSetup(
  ctx: NcVerbContext,
  params: NcSetupParams = {},
): Promise<NcSetupResult> {
  const session = await connectToNcChrome(ctx);
  try {
    return await setupApiAccess(session.page, params, session.context, ctx.log ?? console);
  } finally {
    await session.dispose();
  }
}
