import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /your app starts here/i })).toBeVisible();
});

test('dashboard redirects to login when signed out', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('pricing practice checkout completes', async ({ page }) => {
  await page.goto('/pricing');
  await page
    .getByRole('button', { name: /choose plan/i })
    .nth(1)
    .click();
  await expect(page).toHaveURL(/checkout\/practice/);
  await page.getByRole('button', { name: /complete practice purchase/i }).click();
  await expect(page).toHaveURL(/\/pricing\?checkout=success/);
});
