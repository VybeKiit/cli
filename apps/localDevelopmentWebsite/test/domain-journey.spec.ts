import { expect, test } from '@playwright/test';
import { attachConsoleErrors, expectCleanConsole, sendChatPrompt } from './helpers/liveWork';

/**
 * Fixture-driven domain journey e2e (no real agent / secrets).
 * Open with ?fixture=1 so ChatInput plays fixture tool events.
 */
test.describe('domain journey rail', () => {
  test('auth / database / payments / deploy cards update without console errors', async ({
    page,
  }) => {
    const consoleErrors = attachConsoleErrors(page);

    await page.goto('/?fixture=1');
    await sendChatPrompt(
      page,
      'add google sign-in, neon database, stripe payments, and deploy to cloudflare',
    );

    const rail = page.getByTestId('journey-rail-host');
    await expect(rail.getByTestId('domain-journey-auth')).toBeVisible({ timeout: 15_000 });
    await expect(rail.getByTestId('domain-journey-database')).toBeVisible();
    await expect(rail.getByTestId('domain-journey-payments')).toBeVisible();
    await expect(rail.getByTestId('domain-journey-deploy')).toBeVisible();

    await expect
      .poll(
        async () => {
          const auth = await rail.getByTestId('domain-journey-auth').getAttribute('data-progress');
          const db = await rail
            .getByTestId('domain-journey-database')
            .getAttribute('data-progress');
          const pay = await rail
            .getByTestId('domain-journey-payments')
            .getAttribute('data-progress');
          const deploy = await rail
            .getByTestId('domain-journey-deploy')
            .getAttribute('data-progress');
          return [auth, db, pay, deploy].every((p) => p === '100');
        },
        { timeout: 20_000 },
      )
      .toBe(true);

    expectCleanConsole(consoleErrors);
  });
});
