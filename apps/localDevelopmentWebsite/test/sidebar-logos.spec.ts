import { expect, test } from '@playwright/test';

test.describe('sidebar logos + local chats', () => {
  test('agent rows and new local chat use brand marks', async ({ page }) => {
    await page.goto('/?fixture=1');
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('vybekiit::')) localStorage.removeItem(key);
      }
    });
    await page.reload();

    // Agent list buttons render
    await expect(page.getByTestId('agent-button-claude-code')).toBeVisible();
    await expect(page.getByTestId('agent-button-devin')).toBeVisible();

    // Welcome agent message shows brand logo
    await expect(page.getByTestId('chat-message-agent-logo').first()).toBeVisible({
      timeout: 10_000,
    });

    // Create a local chat and assert logo in list
    await page.getByTestId('new-local-chat').click();
    const localChat = page.locator('[data-testid^="local-chat-"]').first();
    await expect(localChat).toBeVisible({ timeout: 10_000 });
    await expect(localChat.locator('img, svg').first()).toBeVisible();
  });
});
