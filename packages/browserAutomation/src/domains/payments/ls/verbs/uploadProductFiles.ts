import { lsField } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldLocator';
import { saveProductDraftIfEnabled } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/saveDraft';
import type { Page } from 'playwright';

/**
 * Upload deliverable files on the product editor page.
 *
 * @param page - Playwright page to operate on.
 * @param productUrl - Lemon Squeezy product editor URL.
 * @param filesPath - Local path to the deliverable file or folder.
 * @returns Nothing after the upload and optional save attempt.
 * @example
 * await uploadProductFiles(page, product.productUrl, './dist/product.zip');
 */
export const uploadProductFiles = async (
  page: Page,
  productUrl: string,
  filesPath: string,
): Promise<void> => {
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.files.uploadInput')).setInputFiles(filesPath);
  await page.waitForTimeout(2000);

  await saveProductDraftIfEnabled(page);
};
