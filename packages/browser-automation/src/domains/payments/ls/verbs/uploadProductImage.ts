import type { Page } from 'playwright';

import { lsField } from '../dashboard/fieldLocator';

/** Upload product media on the product editor page (dashboard-only — no LS API). */
export async function uploadProductImage(
  page: Page,
  productUrl: string,
  imagePath: string,
): Promise<void> {
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.media.uploadInput')).setInputFiles(imagePath);
  await page.waitForTimeout(2000);

  try {
    const saveDraft = await lsField(page, 'product.actions.saveDraftButton');
    if (await saveDraft.isEnabled()) {
      await saveDraft.click({ timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(800);
    }
  } catch {
    // Media upload may auto-save; missing save button is not fatal.
  }
}
