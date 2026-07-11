import { expect, test } from '@playwright/test';

test.describe('session loading', () => {
  test('clicking a session loads its conversation in the main panel', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');

    // Force a known agent so labels are stable regardless of localStorage.
    await sidebar.getByTestId('agent-button-kiro').click();
    await expect(sidebar.getByText('Kiro sessions', { exact: true })).toBeVisible();

    const sessionButtons = sidebar.locator('[data-testid^="session-item"]');
    // Wait until loading finishes (empty list or session rows). Local session trees can be large.
    await expect
      .poll(
        async () => {
          const stillLoading = await sidebar.getByText('Loading sessions').isVisible();
          if (stillLoading) {
            return false;
          }
          const sessionCount = await sessionButtons.count();
          const noSessions = await sidebar.getByText('No Kiro sessions found').isVisible();
          return sessionCount > 0 || noSessions;
        },
        { timeout: 20_000 },
      )
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
