import { expect, test, type Page } from '@playwright/test';

/** Report Mode tutorial overlays block clicks in dev — dismiss when still visible. */
async function dismissReportModeTutorial(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: 'Skip' });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

test.describe('Web template smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('vybekiit-report-tutorial-done', 'true');
    });
  });

  test('home page loads with translated hero', async ({ page }) => {
    await page.goto('/en');
    await dismissReportModeTutorial(page);
    await expect(page.getByRole('heading', { name: 'Your app starts here.' })).toBeVisible();
  });

  test('dashboard redirects to login when signed out', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('vybekiit-report-tutorial-done', 'true');
    });
    await page.request.post('/api/auth/signout');
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL((url) => url.pathname.endsWith('/en/login'), { timeout: 15_000 });
  });

  test('practice checkout without productId shows error alert', async ({ page }) => {
    await page.goto('/en/checkout/practice');
    await dismissReportModeTutorial(page);
    const checkoutAlert = page.getByRole('alert').filter({ hasText: 'No plan was selected' });
    await expect(checkoutAlert).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to pricing' })).toBeVisible();
  });

  test('pricing practice checkout completes', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/en/pricing');
    await dismissReportModeTutorial(page);
    const proPlan = page.getByRole('button', { name: 'Choose plan' }).nth(1);
    await proPlan.click();
    await expect(page).toHaveURL((url) => url.pathname.includes('/en/checkout/practice'), {
      timeout: 30_000,
    });
    const completeButton = page.getByTestId('practice-checkout-complete');
    await expect(completeButton).toHaveAttribute('data-ready', 'true', { timeout: 15_000 });
    await expect(completeButton).toBeEnabled();
    const checkoutComplete = page.waitForResponse(
      (response) =>
        response.url().includes('/api/checkout/practice/complete') && response.status() === 200,
      { timeout: 45_000 },
    );
    await completeButton.click();
    await checkoutComplete;
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.endsWith('/en/pricing') && url.searchParams.get('checkout') === 'success',
      { timeout: 15_000 },
    );
  });

  test('public SaaS routes render buyer-ready pages', async ({ page }) => {
    const publicRoutes = [
      { path: '/en/products', heading: 'Product catalog' },
      { path: '/en/cart', heading: 'Cart review' },
      { path: '/en/status', heading: 'Service status' },
      { path: '/en/changelog', heading: 'Product changelog' },
      { path: '/en/support', heading: 'Support center' },
    ] as const;

    for (const route of publicRoutes) {
      await page.goto(route.path);
      await dismissReportModeTutorial(page);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    }
  });

  test('signed-in SaaS routes render the full dashboard shell', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          id: 'user_demo',
          email: 'founder@example.com',
          name: 'Founder',
        }),
      });
    });

    const dashboardRoutes = [
      { path: '/en/dashboard/settings', heading: 'User settings' },
      { path: '/en/dashboard/products', heading: 'Product catalog' },
      { path: '/en/dashboard/orders', heading: 'Orders' },
      { path: '/en/dashboard/integrations', heading: 'Integrations' },
      { path: '/en/dashboard/admin', heading: 'Admin command center' },
    ] as const;

    for (const route of dashboardRoutes) {
      await page.goto(route.path);
      await dismissReportModeTutorial(page);
      await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    }
  });
});
