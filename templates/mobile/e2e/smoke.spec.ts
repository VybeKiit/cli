import { expect, test } from '@playwright/test';

test('home screen loads translated hero', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.getByText('Your app starts here.')).toBeVisible({ timeout: 60_000 });
});

test('mobile SaaS screens render plug-and-play app routes', async ({ page }) => {
  test.setTimeout(120_000);
  const screens = [
    { path: '/onboarding', heading: 'Onboarding' },
    { path: '/settings', heading: 'User settings' },
    { path: '/products', heading: 'Product catalog' },
    { path: '/orders', heading: 'Orders' },
    { path: '/service-status', heading: 'Service status' },
    { path: '/changelog', heading: 'Product changelog' },
  ] as const;

  for (const screen of screens) {
    await page.goto(screen.path);
    await expect(page.getByText(screen.heading).first()).toBeVisible({ timeout: 60_000 });
  }
});
