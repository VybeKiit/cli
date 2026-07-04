import { expect, test } from '@playwright/test';

test('dashboard home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('VybeKiit admin')).toBeVisible();
});

test('sign-in page loads', async ({ page }) => {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
