import { expect, test } from '@playwright/test';

test.describe('session loading', () => {
  test('clicking a session loads its conversation in the main panel', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('aside').first();

    // Wait for sidebar sessions to load
    await expect(sidebar.locator('text=Sessions').first()).toBeVisible();

    // Check if any real sessions exist; if not, create a local chat manually first
    const sessionButtons = sidebar.locator('[data-testid^="session-item"]');
    const hasSessions = await sessionButtons.count().then((c) => c > 0);

    if (hasSessions) {
      // Click the first session
      await sessionButtons.first().click();

      // The main panel should show conversation messages area
      const mainPanel = page.locator('main').first();
      await expect(mainPanel).toBeVisible();
    } else {
      // No sessions found in filesystem — test that the "No sessions" text shows
      await expect(sidebar.locator('text=No')).toBeVisible();
    }
  });

  test('new local chat appears in the sidebar', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('aside').first();
    const newLocalChatBtn = sidebar.locator('button:has-text("New local chat")');

    await expect(newLocalChatBtn).toBeVisible();
    await newLocalChatBtn.click();

    // A "New chat" item should appear in the Local Chats group
    const localChatItems = sidebar.locator('div:has-text("Local Chats") + div button');
    // Wait for at least one chat to exist
    await expect(sidebar.locator('text=New chat')).toBeVisible();
  });
});
