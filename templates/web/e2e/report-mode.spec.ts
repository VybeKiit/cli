import { expect, test } from '@playwright/test';

test.describe('Report Mode (dev)', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('dock is visible and toggles inspect mode', async ({ page }) => {
    await page.goto('/');
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
    await page.goto('/');
    await page.keyboard.press('Alt+Shift+R');
    await expect(page.getByTestId('report-mode-banner')).toBeVisible();
    await page.keyboard.press('Alt+Shift+R');
    await expect(page.getByTestId('report-mode-banner')).not.toBeVisible();
  });

  test('click element, describe issue, send report', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('report-mode-toggle').click();

    await page.getByRole('heading', { level: 1 }).first().click();
    await expect(page.getByTestId('report-mode-note-panel')).toBeVisible();
    await expect(page.getByText('What looks wrong here?')).toBeVisible();

    await page.getByTestId('report-mode-note-input').fill('this headline looks wrong');
    await page.getByTestId('report-mode-send').click();

    await expect(page.getByTestId('report-mode-note-panel')).not.toBeVisible();
    await expect(page.getByTestId('report-mode-banner')).not.toBeVisible();
  });

  test('corner preset moves dock anchor', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('report-mode-corner-menu').click();
    await page.getByTestId('report-mode-corner-bottom-left').click();

    await expect(page.getByTestId('report-mode-dock')).toHaveAttribute(
      'data-corner',
      'bottom-left',
    );
  });

  test('note panel uses plain language only', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('dom');
    expect(bodyText.toLowerCase()).not.toContain('selector');
  });
});
