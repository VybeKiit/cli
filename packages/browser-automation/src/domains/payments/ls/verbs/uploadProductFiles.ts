import type { Page } from 'playwright';

import { lsField } from '../dashboard/fieldLocator';

/** Upload deliverable files on the product editor page (second file input). */
export async function uploadProductFiles(
  page: Page,
  productUrl: string,
  filesPath: string,
): Promise<void> {
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.files.uploadInput')).setInputFiles(filesPath);
  await page.waitForTimeout(2_000);

  const saveDraft = await lsField(page, 'product.actions.saveDraftButton');
  if (await saveDraft.isEnabled()) {
    await saveDraft.click({ timeout: 8_000 }).catch(() => undefined);
    await page.waitForTimeout(800);
  }
}
