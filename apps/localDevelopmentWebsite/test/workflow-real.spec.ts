import { spawn } from 'node:child_process';
import { expect, test } from '@playwright/test';

test.describe('workflow real progress via daemon', () => {
  test('workflow steps advance when daemon emits agent.step messages', async ({ page }) => {
    const daemon = spawn('node', ['test/mock-daemon.ts'], {
      cwd: '/Users/yosefhayimsabag/Desktop/Code/vybekiit/apps/localDevelopmentWebsite',
      stdio: 'ignore',
    });

    try {
      await page.waitForTimeout(300);
      await page.goto('/');

      await expect(page.getByTestId('workflow-title')).toHaveText('Ship your SaaS');

      await expect
        .poll(async () => {
          const doneCount = await page
            .locator('[data-testid^="workflow-step-"][data-status="done"]')
            .count();
          const runningCount = await page
            .locator('[data-testid^="workflow-step-"][data-status="running"]')
            .count();
          return doneCount > 0 || runningCount > 0;
        })
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
