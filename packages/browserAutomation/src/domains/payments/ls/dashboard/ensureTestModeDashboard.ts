import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import type { LsSetupMode } from '@vybekiit/browser-automation/domains/payments/ls/types';
import { LS_DASHBOARD_URL } from '@vybekiit/browser-automation/domains/payments/ls/types';
import type { Page } from 'playwright';

/**
 * Locate the Lemon Squeezy sidebar Test mode row.
 *
 * @param page - Playwright page to inspect.
 * @returns Locator for the Test mode row.
 * @example
 * const row = testModeRow(page);
 */
const testModeRow = (page: Page) =>
  page
    .locator('div.flex.h-5.cursor-pointer.items-center')
    .filter({ has: page.getByText('Test mode', { exact: true }) })
    .first();

/**
 * Ensure the Lemon Squeezy dashboard Test mode toggle matches setup mode.
 *
 * @param page - Playwright page already authenticated to Lemon Squeezy.
 * @param mode - Requested Lemon Squeezy setup mode.
 * @param log - Logger for dashboard state changes.
 * @returns Nothing when the dashboard mode is aligned or cannot be changed.
 * @example
 * await ensureTestModeDashboard(page, 'test', console);
 */
export const ensureTestModeDashboard = async (
  page: Page,
  mode: LsSetupMode,
  log: Pick<VerbLogger, 'log'> = DEFAULT_VERB_LOGGER,
): Promise<void> => {
  const wantTest = mode === 'test';
  await page.goto(LS_DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByText('Test mode', { exact: true }).waitFor({ state: 'visible', timeout: 15_000 });

  const row = testModeRow(page);
  const checkbox = row.locator('[role=checkbox]').first();
  if ((await checkbox.count()) === 0) {
    log.log('[ls] Test mode toggle not found — continuing (toggle manually if needed)');
    return;
  }

  const checked = (await checkbox.getAttribute('aria-checked')) === 'true';

  if (checked !== wantTest) {
    const modeLabel = wantTest ? 'ON' : 'OFF';
    log.log(`[ls] setting dashboard Test mode -> ${modeLabel}`);
    await row.click({ timeout: 8000 });
    await page.waitForTimeout(800);
  }
};
