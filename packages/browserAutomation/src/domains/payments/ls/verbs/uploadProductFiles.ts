import { lsField } from '@vybekiit/browserAutomation/domains/payments/ls/dashboard/fieldLocator';
import type { Page } from 'playwright';

/** Upload deliverable files on the product editor page (second file input). */
export async function uploadProductFiles(
  page: Page,
  productUrl: string,
  filesPath: string,
): Promise<void> {
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.files.uploadInput')).setInputFiles(filesPath);
  await page.waitForTimeout(2000);

  try {
    const saveDraft = await lsField(page, 'product.actions.saveDraftButton');
    if (await saveDraft.isEnabled()) {
      await saveDraft.click({ timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(800);
    }
  } catch {
    // File upload may auto-save; missing save button is not fatal.
  }
}
