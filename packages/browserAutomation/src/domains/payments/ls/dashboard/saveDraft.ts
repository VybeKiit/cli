import type { Page } from 'playwright';

import { lsField } from './fieldLocator';

/**
 * Ignore an optional save-draft click failure after upload.
 *
 * @returns Undefined so auto-saved uploads continue.
 * @example
 * await saveDraft.click().catch(ignoreOptionalSaveDraftClick);
 */
const ignoreOptionalSaveDraftClick = (): undefined => undefined;

/**
 * Save the product draft when the dashboard exposes an enabled save button.
 *
 * @param page - Playwright page to operate on.
 * @returns Nothing after an optional save attempt.
 * @example
 * await saveProductDraftIfEnabled(page);
 */
export const saveProductDraftIfEnabled = async (page: Page): Promise<void> => {
  try {
    const saveDraft = await lsField(page, 'product.actions.saveDraftButton');
    if (await saveDraft.isEnabled()) {
      await saveDraft.click({ timeout: 8000 }).catch(ignoreOptionalSaveDraftClick);
      await page.waitForTimeout(800);
    }
  } catch {
    // Uploads may auto-save, so a missing save button is not fatal.
  }
};
