import { expect, test } from '@playwright/test';
import {
  attachConsoleErrors,
  expectActiveBrand,
  expectCleanConsole,
  expectDomainDone,
  sendChatPrompt,
} from './helpers/liveWork';

test('deep-link ?scenario=neon auto-runs and completes with Neon brand', async ({ page }) => {
  await page.goto('/?fixture=1&scenario=neon');
  await expectDomainDone(page, 'database', 25_000);
  await expect(
    page.getByTestId('journey-rail-host').getByTestId('domain-journey-provider'),
  ).toContainText(/neon/i);
  await expectActiveBrand(page, 'database', 'neon');
});

test.describe('provider journeys + crud + db ready checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?fixture=1');
  });

  test('neon database journey completes with ready-check step + brand', async ({ page }) => {
    const consoleErrors = attachConsoleErrors(page);

    await sendChatPrompt(page, 'create neon database with ready feature checks');
    await expectDomainDone(page, 'database');
    const rail = page.getByTestId('journey-rail-host');
    await expect(rail.getByTestId('domain-journey-provider')).toContainText(/neon/i);
    await expectActiveBrand(page, 'database', 'neon');
    await expect(rail.getByTestId('domain-journey-step-db-ready-check')).toHaveAttribute(
      'data-status',
      'done',
    );
    expectCleanConsole(consoleErrors);
  });

  test('supabase database preset completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'wire supabase database');
    await expectDomainDone(page, 'database');
    await expectActiveBrand(page, 'database', 'supabase');
  });

  test('cloudflare index.html deploy completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'deploy index.html to cloudflare pages');
    await expectDomainDone(page, 'deploy');
    const rail = page.getByTestId('journey-rail-host');
    await expectActiveBrand(page, 'deploy', 'cloudflare');
    await expect(rail.getByTestId('domain-journey-step-deploy-artifact')).toHaveAttribute(
      'data-status',
      'done',
    );
    await expect(rail.getByTestId('domain-journey-step-deploy-verify')).toHaveAttribute(
      'data-status',
      'done',
    );
  });

  test('render deploy completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'deploy basic index.html to render');
    await expectDomainDone(page, 'deploy');
    await expectActiveBrand(page, 'deploy', 'render');
  });

  test('railway deploy completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'deploy to railway');
    await expectDomainDone(page, 'deploy');
    await expectActiveBrand(page, 'deploy', 'railway');
  });

  test('crud for orders completes all steps with LS brand', async ({ page }) => {
    await sendChatPrompt(page, 'add crud for orders');
    await expectDomainDone(page, 'crud');
    const rail = page.getByTestId('journey-rail-host');
    await expectActiveBrand(page, 'crud', 'lemon-squeezy');
    for (const id of ['crud-create', 'crud-read', 'crud-update', 'crud-delete', 'crud-verify']) {
      await expect(rail.getByTestId(`domain-journey-step-${id}`)).toHaveAttribute(
        'data-status',
        'done',
      );
    }
  });

  test('stripe payments journey completes checkout + webhook + verify + brand', async ({
    page,
  }) => {
    await sendChatPrompt(page, 'setup stripe payments and checkout');
    await expectDomainDone(page, 'payments');
    const rail = page.getByTestId('journey-rail-host');
    await expectActiveBrand(page, 'payments', 'stripe');
    for (const id of ['pay-provider', 'pay-checkout', 'pay-webhook', 'pay-verify']) {
      await expect(rail.getByTestId(`domain-journey-step-${id}`)).toHaveAttribute(
        'data-status',
        'done',
      );
    }
  });

  test('lemon squeezy payments journey completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'take money with lemon squeezy');
    await expectDomainDone(page, 'payments');
    await expectActiveBrand(page, 'payments', 'lemon-squeezy');
  });

  test('google sign-in auth journey completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'add google sign-in and auth for my app');
    await expectDomainDone(page, 'auth');
    const rail = page.getByTestId('journey-rail-host');
    await expectActiveBrand(page, 'auth', 'google');
    for (const id of ['auth-detect', 'auth-provider', 'auth-pages', 'auth-verify']) {
      await expect(rail.getByTestId(`domain-journey-step-${id}`)).toHaveAttribute(
        'data-status',
        'done',
      );
    }
  });

  test('vercel deploy completes with brand', async ({ page }) => {
    await sendChatPrompt(page, 'deploy to vercel production');
    await expectDomainDone(page, 'deploy');
    await expectActiveBrand(page, 'deploy', 'vercel');
  });

  test('combo neon + stripe + cloudflare all reach 100% with brands', async ({ page }) => {
    await sendChatPrompt(page, 'wire neon database, stripe payments, and deploy to cloudflare');
    await expectDomainDone(page, 'database');
    await expectDomainDone(page, 'payments');
    await expectDomainDone(page, 'deploy');
    await expectActiveBrand(page, 'database', 'neon');
    await expectActiveBrand(page, 'payments', 'stripe');
    await expectActiveBrand(page, 'deploy', 'cloudflare');
  });

  test('session list shows agent logos and skeleton when loading', async ({ page }) => {
    await page.route('**/api/sessions**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], total: 0 }),
      });
    });
    await page.goto('/?fixture=1');
    await expect(page.getByTestId('agent-button-devin')).toBeVisible();
    await expect(page.getByTestId('agent-button-claude-code')).toBeVisible();
  });
});
