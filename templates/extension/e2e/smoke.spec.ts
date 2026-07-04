import { expect, test } from '@playwright/test';

test('popup home screen loads', async ({ page }) => {
  await page.goto('/popup.html');
  await expect(page.getByText('Welcome')).toBeVisible();
});
