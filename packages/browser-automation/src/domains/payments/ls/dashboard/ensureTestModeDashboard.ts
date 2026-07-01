import type { Page } from 'playwright';

import type { LsSetupMode } from '../types';
import { LS_DASHBOARD_URL } from '../types';

/** Sidebar Test mode row: `div.flex.h-5.cursor-pointer…` with `[role=checkbox]`. */
function testModeRow(page: Page) {
  return page
    .locator('div.flex.h-5.cursor-pointer.items-center')
    .filter({ has: page.getByText('Test mode', { exact: true }) })
    .first();
}

/** Ensure the LS sidebar Test mode toggle matches the setup mode before product work. */
export async function ensureTestModeDashboard(
  page: Page,
  mode: LsSetupMode,
  log: Pick<Console, 'log'> = console,
): Promise<void> {
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
    log.log(`[ls] setting dashboard Test mode → ${wantTest ? 'ON' : 'OFF'}`);
    await row.click({ timeout: 8000 });
    await page.waitForTimeout(800);
  }
}
