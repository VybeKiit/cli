import { expect, test, type Page } from '@playwright/test';

async function prepareReportDock(page: Page) {
  await page.goto('/');
  const skip = page.getByRole('button', { name: 'Skip' });
  if (await skip.isVisible()) {
    await skip.click();
  }
  const brandToggle = page.getByTestId('report-mode-brand-toggle');
  await brandToggle.hover();
  await brandToggle.click();
}

test.describe('Report Mode (dev)', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('dock is visible and toggles inspect mode', async ({ page }) => {
    await prepareReportDock(page);
    const dock = page.getByTestId('report-mode-dock');
    await expect(dock).toBeVisible();
    await expect(page.getByTestId('report-mode-banner')).not.toBeVisible();

    await page.getByTestId('report-mode-toggle').click();
    await expect(page.getByTestId('report-mode-banner')).toBeVisible();
    await expect(page.getByTestId('report-mode-banner')).toContainText('Click what looks wrong');

    await page.getByTestId('report-mode-toggle').click();
    await expect(page.getByTestId('report-mode-banner')).not.toBeVisible();
  });

  test('hotkey toggles inspect mode', async ({ page }) => {
    await prepareReportDock(page);
    await page.keyboard.press('Alt+Shift+R');
    await expect(page.getByTestId('report-mode-banner')).toBeVisible();
    await page.keyboard.press('Alt+Shift+R');
    await expect(page.getByTestId('report-mode-banner')).not.toBeVisible();
  });

  test('click element, describe issue, send report', async ({ page }) => {
    await prepareReportDock(page);
    await page.getByTestId('report-mode-toggle').click();

    await page.getByRole('heading', { level: 1 }).first().click();
    await expect(page.getByTestId('report-mode-note-panel')).toBeVisible();
    await expect(page.getByText('What looks wrong here?')).toBeVisible();
    await expect(page.getByTestId('report-mode-spot-label')).not.toBeEmpty();

    await page.getByTestId('report-mode-copy-spot').click();
    const spotLabel = await page.getByTestId('report-mode-spot-label').innerText();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(spotLabel);

    await page.getByTestId('report-mode-note-input').fill('this headline looks wrong');
    await page.getByTestId('report-mode-send').click();

    await expect(page.getByTestId('report-mode-note-panel')).not.toBeVisible();
    await expect(page.getByTestId('report-mode-banner')).not.toBeVisible();
  });

  test('corner preset moves dock anchor', async ({ page }) => {
    await prepareReportDock(page);
    await page.getByTestId('report-mode-corner-menu').hover();
    const corner = page.getByTestId('report-mode-corner-bottom-left');
    await corner.hover();
    await page.waitForTimeout(2100);

    await expect(page.getByTestId('report-mode-dock')).toHaveAttribute(
      'data-corner',
      'bottom-left',
    );
  });

  test('note panel uses plain language only', async ({ page }) => {
    await prepareReportDock(page);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('dom');
    expect(bodyText.toLowerCase()).not.toContain('selector');
  });
});
