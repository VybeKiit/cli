import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToCwsChrome } from '@vybekiit/browser-automation/domains/extension/connect';
import { MissingItemIdError } from '@vybekiit/browser-automation/domains/extension/errors';
import { fieldLocator } from '@vybekiit/browser-automation/domains/extension/locator';
import { safeClick } from '@vybekiit/browser-automation/domains/extension/safeClick';
import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  packageUrl,
} from '@vybekiit/browser-automation/domains/extension/urls';
import { runVerifyGate } from '@vybekiit/browser-automation/domains/extension/verifyGate';

/**
 * Publish a draft that has already cleared review.
 *
 * For routine version-only releases of an existing listed extension,
 * prefer `pnpm cli deploy <ext>` — that flow uses the official Chrome
 * Web Store Publish API via `chrome-webstore-upload-cli` and is more
 * stable than UI automation. This verb exists for the cases the API
 * does not cover: publishing a listing-only change that doesn't bump
 * the package version.
 *
 * @param ctx - Extension automation context with repo paths, auth state, and logging.
 * @returns A promise that resolves after the publish button is clicked.
 * @example
 * await publish(ctx);
 */
export const publish = async (ctx: VerbContext): Promise<void> => {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'publish');
  }

  await runVerifyGate(ctx);

  const session = await connectToCwsChrome(ctx);
  try {
    const log = resolveVerbLogger(ctx);
    log.log(`[cws] publishing ${ctx.extension.name}`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(packageUrl(groupId, ctx.extension.chromeWebStoreId));
    await safeClick(fieldLocator(session.page, 'actions.publishButton'), 'publish');
  } finally {
    await session.dispose();
  }
};
