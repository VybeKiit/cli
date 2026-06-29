import type { VerbContext } from '../types';

import { connectToCwsChrome } from '../connect';
import { recordChromeWebStoreId } from '../cwsIdRegistry';
import { fieldLocator } from '../locator';
import { buildAndFindZip } from '../packageZip';
import { safeClick } from '../safeClick';
import { dashboardUrl } from '../urls';
import { runVerifyGate } from '../verifyGate';

/**
 * Create a brand-new dev-console item from an extension that doesn't yet
 * have a `chromeWebStoreId`. Mints the ID, uploads the initial zip,
 * captures the assigned ID from the post-upload URL, and records it in
 * `cws.json`.
 *
 * Sequence:
 *
 *  1. Run the verify gate. Failing checks abort before any CWS write.
 *  2. Build + zip the extension (reuses the same `pnpm build && pnpm zip`
 *     scripts the existing `deployExtension` flow uses, so the zip layout
 *     is identical to what users normally publish).
 *  3. Open the dev console dashboard, click "Add a new item".
 *  4. Upload the zip via `setInputFiles`.
 *  5. Wait for the dev console to redirect to the new item's edit URL,
 *     parse the assigned ID out of `page.url()`.
 *  6. Write the ID back into the CWS deploy-target registry.
 *
 * Post-condition: `cws.json` now has the new ID staged (uncommitted) and
 * the extension exists as a draft on CWS. The developer should commit the
 * registry change. `submitForReview` and `publish` are separate verbs.
 */
export async function createNewItem(ctx: VerbContext): Promise<{ chromeWebStoreId: string }> {
  if (ctx.extension.chromeWebStoreId) {
    throw new Error(
      `Extension "${ctx.extension.key}" already has chromeWebStoreId="${ctx.extension.chromeWebStoreId}". createNewItem refuses to mint a duplicate.`,
    );
  }
  const log = ctx.log ?? console;

  await runVerifyGate(ctx);

  const zipPath = await buildAndFindZip(ctx);

  const session = await connectToCwsChrome(ctx);
  try {
    log.log('[cws] opening dashboard to add new item');
    await session.page.goto(dashboardUrl());

    await safeClick(fieldLocator(session.page, 'newItem.addButton'), 'createNewItem');

    log.log(`[cws] uploading ${zipPath}`);
    await fieldLocator(session.page, 'newItem.zipUploadInput').setInputFiles(zipPath);

    await session.page.waitForURL(NEW_ITEM_URL_PATTERN, { timeout: 60_000 });
    const newId = parseItemIdFromUrl(session.page.url());
    log.log(`[cws] minted item id ${newId}`);

    await recordChromeWebStoreId(ctx.repoRoot, ctx.extension.key, newId);
    log.log('[cws] wrote chromeWebStoreId back into cws.json (uncommitted)');

    return { chromeWebStoreId: newId };
  } finally {
    await session.dispose();
  }
}

/**
 * The dev console URL after upload is
 * `https://chrome.google.com/webstore/devconsole/<groupId>/<itemId>/edit/...`.
 * The group ID is a UUID; the item ID is a 32-char lowercase hex slug.
 */
const NEW_ITEM_URL_PATTERN =
  /\/devconsole\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9]{32}\//;

function parseItemIdFromUrl(url: string): string {
  const match = url.match(
    /\/devconsole\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/([a-z0-9]{32})\//,
  );
  if (!(match && match[1])) {
    throw new Error(`Could not parse CWS Item ID from URL: ${url}`);
  }
  return match[1];
}
