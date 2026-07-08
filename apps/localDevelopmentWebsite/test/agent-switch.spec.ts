import { expect, test } from '@playwright/test';

test.describe('agent switch', () => {
  test('switching agent reloads the sidebar sessions', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');
    await expect(sidebar).toBeVisible();

    const claudeButton = sidebar.getByTestId('agent-button-claude-code');
    const kiroButton = sidebar.getByTestId('agent-button-kiro');

    await expect(kiroButton).toBeVisible();
    await expect(claudeButton).toBeVisible();

    await expect(sidebar.getByText('Kiro sessions')).toBeVisible();

    await claudeButton.click();

    const newSessionBtn = sidebar.getByTestId('new-agent-session');
    await expect(sidebar.getByText('Claude Code sessions')).toBeVisible({ timeout: 5000 });
    await expect(newSessionBtn).toBeVisible({ timeout: 5000 });
    await expect(newSessionBtn).toContainText('New Claude Code session');

    await kiroButton.click();
    await expect(sidebar.getByText('Kiro sessions')).toBeVisible({ timeout: 5000 });
    await expect(newSessionBtn).toContainText('New Kiro session');
  });

  test('active agent button has highlighted style', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');
    const kiroButton = sidebar.getByTestId('agent-button-kiro');
    const claudeButton = sidebar.getByTestId('agent-button-claude-code');

    await expect(kiroButton).toHaveAttribute('aria-pressed', 'true');
    await expect(claudeButton).toHaveAttribute('aria-pressed', 'false');

    await claudeButton.click();

    await expect(claudeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(kiroButton).toHaveAttribute('aria-pressed', 'false');
  });
});
