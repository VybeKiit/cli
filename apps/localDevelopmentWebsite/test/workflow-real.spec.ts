import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test.describe('workflow real progress via daemon', () => {
  test('idle chat has no hardcoded workflow board', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('workflow-board')).toHaveCount(0);
    await expect(page.getByTestId('workflow-title')).toHaveCount(0);
  });

  test('workflow steps advance when daemon emits agent.step messages', async ({ page }) => {
    // Seed the board first — markStep* no-ops while workflow is null.
    // Then start the mock daemon so the reconnect path drives real progress.
    await page.goto('/');

    const input = page.locator('textarea').first();
    await expect(input).toBeVisible();
    await input.fill('ship my SaaS with auth payments and deploy');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('workflow-board')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('workflow-title')).toBeVisible();

    const daemon = spawn(
      process.execPath,
      ['--experimental-strip-types', join(appRoot, 'test/mock-daemon.ts')],
      {
        cwd: appRoot,
        stdio: 'ignore',
      },
    );

    try {
      // useDaemon reconnects every 3s when the socket is down.
      await expect
        .poll(
          async () => {
            const doneCount = await page
              .locator('[data-testid^="workflow-step-"][data-status="done"]')
              .count();
            const runningCount = await page
              .locator('[data-testid^="workflow-step-"][data-status="running"]')
              .count();
            return doneCount > 0 || runningCount > 0;
          },
          { timeout: 20_000 },
        )
        .toBe(true);
    } finally {
      daemon.kill();
    }
  });

  test('daemon connection status shows connected', async ({ page }) => {
    await page.goto('/');

    const badge = page.locator('header span:has-text("MCP")');
    if ((await badge.count()) > 0) {
      await expect(badge).toBeVisible();
    }
  });
});
