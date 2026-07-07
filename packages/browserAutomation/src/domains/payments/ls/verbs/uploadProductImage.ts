import { lsField } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldLocator';
import { saveProductDraftIfEnabled } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/saveDraft';
import type { Page } from 'playwright';

/**
 * Upload product media on the product editor page.
 *
 * @param page - Playwright page to operate on.
 * @param productUrl - Lemon Squeezy product editor URL.
 * @param imagePath - Local image path to upload.
 * @returns Nothing after the upload and optional save attempt.
 * @example
 * await uploadProductImage(page, product.productUrl, './assets/cover.png');
 */
export const uploadProductImage = async (
  page: Page,
  productUrl: string,
  imagePath: string,
): Promise<void> => {
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.media.uploadInput')).setInputFiles(imagePath);
  await page.waitForTimeout(2000);

  await saveProductDraftIfEnabled(page);
};
