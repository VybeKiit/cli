import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToCwsChrome } from '@vybekiit/browser-automation/domains/extension/connect';
import { recordChromeWebStoreId } from '@vybekiit/browser-automation/domains/extension/cwsIdRegistry';
import { fieldLocator } from '@vybekiit/browser-automation/domains/extension/locator';
import { buildAndFindZip } from '@vybekiit/browser-automation/domains/extension/packageZip';
import { safeClick } from '@vybekiit/browser-automation/domains/extension/safeClick';
import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import { dashboardUrl } from '@vybekiit/browser-automation/domains/extension/urls';
import { runVerifyGate } from '@vybekiit/browser-automation/domains/extension/verifyGate';

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
 *
 * @param ctx - Extension automation context with repo paths, auth state, and logging.
 * @returns The newly minted Chrome Web Store item id.
 * @example
 * const { chromeWebStoreId } = await createNewItem(ctx);
 */
export const createNewItem = async (ctx: VerbContext): Promise<{ chromeWebStoreId: string }> => {
  if (ctx.extension.chromeWebStoreId) {
    throw new Error(
      `Extension "${ctx.extension.key}" already has chromeWebStoreId="${ctx.extension.chromeWebStoreId}". createNewItem refuses to mint a duplicate.`,
    );
  }
  const log = resolveVerbLogger(ctx);

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
};

/**
 * The dev console URL after upload is
 * `https://chrome.google.com/webstore/devconsole/<groupId>/<itemId>/edit/...`.
 * The group ID is a UUID; the item ID is a 32-char lowercase hex slug.
 */
// CWS edit URL: "/devconsole/<uuid>/<32-char-id>/edit" -> match
const NEW_ITEM_URL_PATTERN =
  /\/devconsole\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9]{32}\//;

// CWS edit URL: "/devconsole/<uuid>/<32-char-id>/edit" -> "<32-char-id>"
const CWS_ITEM_ID_PATTERN =
  /\/devconsole\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/([a-z0-9]{32})\//;

/**
 * Parse a Chrome Web Store item id from a post-upload edit URL.
 *
 * @param url - Chrome Web Store dev-console URL after upload.
 * @returns The 32-character Chrome Web Store item id.
 * @example
 * const itemId = parseItemIdFromUrl('https://chrome.google.com/webstore/devconsole/00000000-0000-0000-0000-000000000000/abcdefghijklmnopqrstuvwxzy123456/edit');
 */
const parseItemIdFromUrl = (url: string): string => {
  const match = url.match(CWS_ITEM_ID_PATTERN);
  if (match === null || match[1] === undefined) {
    throw new Error(`Could not parse CWS Item ID from URL: ${url}`);
  }
  return match[1];
};
