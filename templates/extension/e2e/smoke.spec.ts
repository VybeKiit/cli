import { expect, test } from '@playwright/test';

test('popup home screen loads', async ({ page }) => {
  await page.goto('/popup.html');
  await expect(page.getByText('Your entire stack.')).toBeVisible();
});

test('side panel renders full SaaS navigation screens', async ({ page }) => {
  await page.goto('/sidepanel.html');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  const screens = [
    { button: 'Products', heading: 'Product catalog' },
    { button: 'User settings', heading: 'User settings' },
    { button: 'Status', heading: 'Service status' },
    { button: 'Changelog', heading: 'Product changelog' },
    { button: 'Admin', heading: 'Admin command center' },
  ] as const;

  for (const screen of screens) {
    await page.getByRole('button', { name: screen.button, exact: true }).click();
    await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible();
  }
});
