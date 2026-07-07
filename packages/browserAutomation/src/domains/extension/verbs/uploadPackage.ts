import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToCwsChrome } from '@vybekiit/browser-automation/domains/extension/connect';
import { MissingItemIdError } from '@vybekiit/browser-automation/domains/extension/errors';
import { buildAndFindZip } from '@vybekiit/browser-automation/domains/extension/packageZip';
import { safeClick } from '@vybekiit/browser-automation/domains/extension/safeClick';
import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  packageUrl,
} from '@vybekiit/browser-automation/domains/extension/urls';
import { runVerifyGate } from '@vybekiit/browser-automation/domains/extension/verifyGate';
import type { Page } from 'playwright';

/**
 * Public contract for upload package result at the Chrome Web Store automation module boundary.
 */
export type UploadPackageResult = {
  readonly packageText: string;
  readonly zipPath: string;
};

// package summary panel: "Package ... Useful Resources" -> "Package ..."
const PACKAGE_SUMMARY_PATTERN = /Package[\s\S]*?Useful Resources/;

// upload package button: "Upload new package" -> match
const UPLOAD_NEW_PACKAGE_BUTTON_PATTERN = /Upload new package/i;

/**
 * Upload a new package zip for an existing CWS item via the package tab.
 *
 * The official Publish API remains the preferred path when OAuth client
 * credentials are available, but this verb gives the CDP automation a
 * repeatable fallback for the common "listing automation is authenticated,
 * upload the same release artifact" case.
 *
 * @param ctx - Extension automation context with repo paths, auth state, and logging.
 * @returns The uploaded zip path and package-tab summary text.
 * @example
 * const result = await uploadPackage(ctx);
 */
export const uploadPackage = async (ctx: VerbContext): Promise<UploadPackageResult> => {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'uploadPackage');
  }

  await runVerifyGate(ctx);
  const zipPath = await buildAndFindZip(ctx);

  const session = await connectToCwsChrome(ctx);
  try {
    const log = resolveVerbLogger(ctx);
    log.log(`[cws] uploading package for ${ctx.extension.name}: ${zipPath}`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(packageUrl(groupId, ctx.extension.chromeWebStoreId), {
      timeout: 60_000,
      waitUntil: 'load',
    });

    const fileChooserPromise = session.page
      .waitForEvent('filechooser', { timeout: 30_000 })
      .catch(() => null);
    await safeClick(
      session.page.getByRole('button', { name: UPLOAD_NEW_PACKAGE_BUTTON_PATTERN }).first(),
      'uploadPackage',
    );
    const fileChooser = await fileChooserPromise;
    if (fileChooser) {
      await fileChooser.setFiles(zipPath);
    } else {
      const input = session.page.locator('input[type=file]').first();
      await input.waitFor({ state: 'attached', timeout: 30_000 });
      await input.setInputFiles(zipPath);
    }

    await session.page.waitForLoadState('networkidle', { timeout: 180_000 }).catch(() => undefined);
    await session.page.waitForTimeout(5000);
    await session.page.goto(packageUrl(groupId, ctx.extension.chromeWebStoreId), {
      timeout: 60_000,
      waitUntil: 'load',
    });
    await session.page.waitForTimeout(2500);

    return {
      packageText: await readPackageSummary(session.page),
      zipPath,
    };
  } finally {
    await session.dispose();
  }
};

/**
 * Read the package tab summary after an upload attempt.
 *
 * @param page - Chrome Web Store package page.
 * @returns The package summary panel text, capped to the page body prefix when the panel is absent.
 * @example
 * const packageText = await readPackageSummary(page);
 */
const readPackageSummary = async (page: Page): Promise<string> => {
  const text = await page.locator('body').innerText();
  const match = text.match(PACKAGE_SUMMARY_PATTERN);
  if (match !== null && match[0] !== undefined) {
    return match[0];
  }
  return text.slice(0, 5000);
};
