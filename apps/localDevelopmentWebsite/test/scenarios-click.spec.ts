import { expect, test } from '@playwright/test';

/**
 * Real click path on /scenarios — the page users open to watch demos.
 * Does not depend on chat auto-run or localStorage.
 */
test.describe('scenarios page click-to-run', () => {
  test('click neon runs Live work to 100%', async ({ page }) => {
    await page.goto('/scenarios');

    await expect(page.getByTestId('scenarios-list')).toBeVisible();
    await expect(
      page.getByTestId('scenario-run-neon').getByTestId('provider-mark').first(),
    ).toHaveAttribute('data-provider', 'neon');
    await page.getByTestId('scenario-run-neon').click();

    const host = page.getByTestId('scenarios-rail-host');
    await expect(host.getByTestId('domain-journey-database')).toBeVisible({ timeout: 10_000 });
    await expect(host.getByTestId('provider-mark')).toHaveAttribute('data-provider', 'neon');
    await expect
      .poll(async () => host.getByTestId('domain-journey-database').getAttribute('data-progress'), {
        timeout: 20_000,
      })
      .toBe('100');
    await expect(host.getByTestId('provider-mark')).toHaveAttribute('data-active', 'true');

    await expect(page.getByTestId('scenarios-status')).toContainText(/Done: Neon/i);
  });

  test('list shows LS for orders and multi brands for combo', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(
      page.getByTestId('scenario-run-crud-orders').getByTestId('provider-mark').first(),
    ).toHaveAttribute('data-provider', 'lemon-squeezy');
    await expect(
      page.getByTestId('scenario-run-combo').getByTestId('provider-mark-stack'),
    ).toHaveAttribute('data-count', '3');
  });

  test('click stripe then cloudflare both complete', async ({ page }) => {
    await page.goto('/scenarios');

    await page.getByTestId('scenario-run-stripe').click();
    const host = page.getByTestId('scenarios-rail-host');
    await expect
      .poll(async () => host.getByTestId('domain-journey-payments').getAttribute('data-progress'), {
        timeout: 20_000,
      })
      .toBe('100');

    await page.getByTestId('scenario-run-cloudflare').click();
    await expect
      .poll(async () => host.getByTestId('domain-journey-deploy').getAttribute('data-progress'), {
        timeout: 20_000,
      })
      .toBe('100');
  });

  test('?run=saas auto-starts full combo', async ({ page }) => {
    await page.goto('/scenarios?run=saas');
    const host = page.getByTestId('scenarios-rail-host');
    await expect(host.getByTestId('domain-journey-auth')).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(
        async () => {
          const a = await host.getByTestId('domain-journey-auth').getAttribute('data-progress');
          const d = await host.getByTestId('domain-journey-database').getAttribute('data-progress');
          const p = await host.getByTestId('domain-journey-payments').getAttribute('data-progress');
          const g = await host.getByTestId('domain-journey-deploy').getAttribute('data-progress');
          return [a, d, p, g].every((v) => v === '100');
        },
        { timeout: 25_000 },
      )
      .toBe(true);
  });
});
