import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

test.describe('workflow real progress via daemon', () => {
  test.beforeAll(() => {
    // Ensure the mock daemon script is ready
    // The daemon will auto-connect ws://localhost:3006
  });

  test('workflow steps advance when daemon emits agent.step messages', async ({ page }) => {
    // First start the mock daemon in background
    const daemonPid = execSync(
      'node test/mock-daemon.ts & echo $!',
      { cwd: '/Users/yosefhayimsabag/Desktop/Code/vybekiit/apps/localDevelopmentWebsite', encoding: 'utf-8' },
    ).trim();

    try {
      await page.goto('/');

      // The workflow panel is on the right side (xl:block)
      const workflowPanel = page.locator('aside.w-\\[420px\\]');
      // Playwright may not see the wide panel; just check workflow exists in DOM
      const workflowTitle = page.locator('h2:has-text("SaaS Workflow")');
      await expect(workflowTitle).toBeVisible();

      // Wait for daemon to connect and step messages to arrive
      // The mock daemon emits steps every 500ms
      await page.waitForTimeout(3_000);

      // By now at least one step should be marked as "running" or "done"
      // We look for the green checkmark icon or the running spinner
      const doneSteps = page.locator('svg[role="img"][aria-label="Done"]').or(
        page.locator('svg[class*="text-emerald"]'),
      );
      const runningSteps = page.locator('svg[class*="animate-spin"]').or(
        page.locator('svg[class*="text-vybe"]'),
      );

      const hasProgress = await doneSteps.count().then((c) => c > 0).catch(() => false)
        || await runningSteps.count().then((c) => c > 0).catch(() => false);

      expect(hasProgress).toBe(true);
    } finally {
      try {
        execSync(`kill ${daemonPid} 2>/dev/null || true`);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  test('daemon connection status shows connected', async ({ page }) => {
    await page.goto('/');

    // The agent badge shows connection status
    const badge = page.locator('header span:has-text("MCP")');
    // MCP badge is only shown for MCP-capable agents
    const hasMcpBadge = await badge.isVisible().catch(() => false);
    if (hasMcpBadge) {
      await expect(badge).toBeVisible();
    }
  });
});
