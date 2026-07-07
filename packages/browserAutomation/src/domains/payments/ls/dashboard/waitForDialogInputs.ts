import type { Page } from 'playwright';

/**
 * Wait for any visible page-level text input when the dialog selector misses.
 *
 * @param page - Playwright page to inspect.
 * @returns Nothing when an input becomes visible.
 * @example
 * await waitForVisiblePageInput(page);
 */
const waitForVisiblePageInput = async (page: Page): Promise<void> => {
  await page
    .locator('input:visible, textarea:visible')
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });
};

/**
 * Wait for an API-key dialog input, falling back to any visible page input.
 *
 * @param page - Playwright page to inspect.
 * @returns Nothing when an input is ready.
 * @example
 * await waitForDialogInputs(page);
 */
export const waitForDialogInputs = async (page: Page): Promise<void> => {
  await page
    // biome-ignore lint/security/noSecrets: CSS selector, not a secret.
    .locator('[role="dialog"] input, [role="dialog"] textarea, dialog input, dialog textarea')
    .first()
    .waitFor({ state: 'visible', timeout: 8000 })
    .catch(async () => waitForVisiblePageInput(page));
};
