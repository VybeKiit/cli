import type { Page } from 'playwright';

export async function waitForDialogInputs(page: Page): Promise<void> {
  await page
    .locator('[role="dialog"] input, [role="dialog"] textarea, dialog input, dialog textarea')
    .first()
    .waitFor({ state: 'visible', timeout: 8_000 })
    .catch(async () => {
      await page
        .locator('input:visible, textarea:visible')
        .first()
        .waitFor({ state: 'visible', timeout: 5_000 });
    });
}
