import { expect, test, type Page } from '@playwright/test';

// matches whole word "dom", not "domain"
const DOM_WORD_PATTERN = /\bdom\b/;
// matches whole word "selector"
const SELECTOR_WORD_PATTERN = /\bselector\b/;

const prepareReportDock = async (page: Page) => {
  await page.goto('/en/');
  const skip = page.getByRole('button', { name: 'Skip' });
  if (await skip.isVisible()) {
    await skip.click();
  }
  const brandToggle = page.getByTestId('report-mode-brand-toggle');
  await brandToggle.hover();
  await brandToggle.click();
};

test.describe('Report Mode (dev)', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await context.addInitScript(() => {
      localStorage.setItem('vybekiit-report-tutorial-done', 'true');
    });
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

  test('inspect highlight color preset updates ring', async ({ page }) => {
    await prepareReportDock(page);
    await page.getByTestId('report-mode-toggle').click();

    await page.getByRole('heading', { level: 1 }).first().hover();
    await expect(page.getByTestId('report-mode-highlight')).toBeVisible();

    await page.getByTestId('report-mode-highlight-color').hover();
    await page.getByTestId('report-mode-highlight-preset-3b82f6').click();

    const borderColor = await page
      .getByTestId('report-mode-highlight')
      .evaluate((element) => getComputedStyle(element).borderColor);
    expect(borderColor).toBe('rgb(59, 130, 246)');
  });

  test('note panel uses plain language only', async ({ page }) => {
    await prepareReportDock(page);
    const reportUi = page.locator('[data-report-mode-ui="true"]');
    const uiText = await reportUi.allInnerTexts();
    const combined = uiText.join('\n').toLowerCase();
    expect(combined).not.toMatch(DOM_WORD_PATTERN);
    expect(combined).not.toMatch(SELECTOR_WORD_PATTERN);
  });
});
