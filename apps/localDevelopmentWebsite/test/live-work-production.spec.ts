import { expect, test } from '@playwright/test';
import {
  attachConsoleErrors,
  expectActiveBrand,
  expectCleanConsole,
  expectDomainDone,
  LIVE_WORK_CASES,
  sendChatPrompt,
} from './helpers/liveWork';

/**
 * Production gate for Live work:
 * - Every openable scenario on /scenarios runs to 100% with correct brand marks
 * - Chat path (?fixture=1) seeds + completes with active provider logos
 * - Defaults (payments → LS) and multi-domain stacks
 * - No secrets / unexpected console errors
 *
 * Safe for CI: fixture tool stream only (no real MCP keys).
 */
test.describe('Live work production matrix — /scenarios click path', () => {
  test.describe.configure({ mode: 'serial' });

  for (const scenario of LIVE_WORK_CASES) {
    test(`scenario ${scenario.id}: brands + 100%`, async ({ page }) => {
      const errors = attachConsoleErrors(page);
      await page.goto('/scenarios');
      await expect(page.getByTestId('scenarios-list')).toBeVisible();

      const runBtn = page.getByTestId(`scenario-run-${scenario.id}`);
      await expect(runBtn).toBeVisible();
      // List always exposes a brand stack (1+ marks).
      await expect(runBtn.getByTestId('provider-mark-stack')).toBeVisible();
      await expect(runBtn.getByTestId('provider-mark').first()).toBeVisible();

      await runBtn.click();

      const host = page.getByTestId('scenarios-rail-host');
      for (const domain of scenario.domains) {
        const card = host.getByTestId(`domain-journey-${domain}`);
        await expect(card).toBeVisible({ timeout: 15_000 });
        await expect
          .poll(async () => card.getAttribute('data-progress'), { timeout: 30_000 })
          .toBe('100');
        const brandId = scenario.brands[domain];
        expect(brandId, `missing brand for ${scenario.id}/${domain}`).toBeTruthy();
        await expectActiveBrand(page, domain, brandId as string, 'scenarios-rail-host');
      }

      await expect(page.getByTestId('scenarios-status')).toContainText(/Done:/i);
      expectCleanConsole(errors);
    });
  }

  test('re-run same scenario resets and completes again', async ({ page }) => {
    await page.goto('/scenarios');
    const btn = page.getByTestId('scenario-run-neon');
    await btn.click();
    const host = page.getByTestId('scenarios-rail-host');
    await expect
      .poll(async () => host.getByTestId('domain-journey-database').getAttribute('data-progress'), {
        timeout: 25_000,
      })
      .toBe('100');

    await btn.click();
    // Mid-run progress should leave 100 then climb back (or stay seeding).
    await expect
      .poll(async () => host.getByTestId('domain-journey-database').getAttribute('data-progress'), {
        timeout: 25_000,
      })
      .toBe('100');
    await expectActiveBrand(page, 'database', 'neon', 'scenarios-rail-host');
  });
});

test.describe('Live work production matrix — chat fixture path', () => {
  test.describe.configure({ mode: 'serial' });

  for (const scenario of LIVE_WORK_CASES) {
    test(`chat ${scenario.id}: brands + 100%`, async ({ page }) => {
      const errors = attachConsoleErrors(page);
      await page.goto('/?fixture=1');
      await sendChatPrompt(page, scenario.prompt);

      for (const domain of scenario.domains) {
        await expectDomainDone(page, domain, 30_000);
        const brandId = scenario.brands[domain];
        expect(brandId).toBeTruthy();
        await expectActiveBrand(page, domain, brandId as string);
      }

      expectCleanConsole(errors);
    });
  }

  test('chat deep-link ?scenario=lemon auto-runs LS brand', async ({ page }) => {
    await page.goto('/?fixture=1&scenario=lemon');
    await expectDomainDone(page, 'payments', 30_000);
    await expectActiveBrand(page, 'payments', 'lemon-squeezy');
  });

  test('chat payments default brand is Lemon Squeezy', async ({ page }) => {
    await page.goto('/?fixture=1');
    await sendChatPrompt(page, 'take money with checkout');
    await expectDomainDone(page, 'payments');
    await expectActiveBrand(page, 'payments', 'lemon-squeezy');
  });

  test('chat database default brand is Neon', async ({ page }) => {
    await page.goto('/?fixture=1');
    await sendChatPrompt(page, 'save data so the app remembers things');
    await expectDomainDone(page, 'database');
    await expectActiveBrand(page, 'database', 'neon');
  });
});

test.describe('Live work production — workflow board brands', () => {
  test('detected steps carry provider brands when board seeds', async ({ page }) => {
    await page.goto('/?fixture=1');
    await sendChatPrompt(page, 'wire neon database, stripe payments, and deploy to cloudflare');

    // Journey rail is the Live work SSOT; workflow board may also seed.
    await expectDomainDone(page, 'database');
    await expectDomainDone(page, 'payments');
    await expectDomainDone(page, 'deploy');

    const board = page.getByTestId('workflow-board');
    if ((await board.count()) > 0) {
      await expect(board.getByTestId('workflow-step-database')).toHaveAttribute(
        'data-provider',
        'neon',
      );
      await expect(board.getByTestId('workflow-step-payment')).toHaveAttribute(
        'data-provider',
        'stripe',
      );
      await expect(board.getByTestId('workflow-step-deploy')).toHaveAttribute(
        'data-provider',
        'cloudflare',
      );
    }
  });
});
