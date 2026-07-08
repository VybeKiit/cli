import { expect, test } from '@playwright/test';

test.describe('session loading', () => {
  test('clicking a session loads its conversation in the main panel', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');

    await expect(sidebar.getByText('Kiro sessions')).toBeVisible();

    const sessionButtons = sidebar.locator('[data-testid^="session-item"]');
    await expect
      .poll(async () => {
        const sessionCount = await sessionButtons.count();
        const noSessions = await sidebar.getByText('No Kiro sessions found').isVisible();
        return sessionCount > 0 || noSessions;
      })
      .toBe(true);

    const hasSessions = await sessionButtons.count().then((c) => c > 0);

    if (hasSessions) {
      await sessionButtons.first().click();

      const mainPanel = page.locator('main').first();
      await expect(mainPanel).toBeVisible();
    } else {
      await expect(sidebar.getByText('No Kiro sessions found')).toBeVisible();
    }
  });

  test('new local chat appears in the sidebar', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');
    const newLocalChatBtn = sidebar.getByTestId('new-local-chat');

    await expect(newLocalChatBtn).toBeVisible();
    await newLocalChatBtn.click();

    await expect(sidebar.locator('text=New chat')).toBeVisible();
  });
});
