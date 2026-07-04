import { expect, test } from '@playwright/test';

test('home screen loads translated hero', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.getByText('Your app starts here.')).toBeVisible({ timeout: 60_000 });
});
