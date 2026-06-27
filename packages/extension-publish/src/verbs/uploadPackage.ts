import type { Page } from 'playwright';

import type { VerbContext } from '../types';

import { connectToCwsChrome } from '../connect';
import { MissingItemIdError } from '../errors';
import { buildAndFindZip } from '../packageZip';
import { safeClick } from '../safeClick';
import { discoverDeveloperGroupId, packageUrl } from '../urls';
import { runVerifyGate } from '../verifyGate';

/**
 * Public contract for upload package result at the Chrome Web Store automation module boundary.
 */
export type UploadPackageResult = {
  packageText: string;
  zipPath: string;
};

/**
 * Upload a new package zip for an existing CWS item via the package tab.
 *
 * The official Publish API remains the preferred path when OAuth client
 * credentials are available, but this verb gives the CDP automation a
 * repeatable fallback for the common "listing automation is authenticated,
 * upload the same release artifact" case.
 */
export async function uploadPackage(ctx: VerbContext): Promise<UploadPackageResult> {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'uploadPackage');
  }

  await runVerifyGate(ctx);
  const zipPath = await buildAndFindZip(ctx);

  const session = await connectToCwsChrome(ctx);
  try {
    const log = ctx.log ?? console;
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
      session.page.getByRole('button', { name: /Upload new package/i }).first(),
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
    await session.page.waitForTimeout(5_000);
    await session.page.goto(packageUrl(groupId, ctx.extension.chromeWebStoreId), {
      timeout: 60_000,
      waitUntil: 'load',
    });
    await session.page.waitForTimeout(2_500);

    return {
      packageText: await readPackageSummary(session.page),
      zipPath,
    };
  } finally {
    await session.dispose();
  }
}

async function readPackageSummary(page: Page): Promise<string> {
  const text = await page.locator('body').innerText();
  return text.match(/Package[\s\S]*?Useful Resources/)?.[0] ?? text.slice(0, 5_000);
}
