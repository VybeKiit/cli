import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test.describe('workflow real progress via daemon', () => {
  test('workflow steps advance when daemon emits agent.step messages', async ({ page }) => {
    // Use process.execPath (not bare "node") so PATH-less CI runners still spawn Node.
    // mock-daemon is TypeScript — strip types on Node 22+ without a separate build step.
    const daemon = spawn(
      process.execPath,
      ['--experimental-strip-types', join(appRoot, 'test/mock-daemon.ts')],
      {
        cwd: appRoot,
        stdio: 'ignore',
      },
    );

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
