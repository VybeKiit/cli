import { expect, test } from '@playwright/test';

test.describe('agent switch', () => {
  test('switching agent reloads the sidebar sessions', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');
    await expect(sidebar).toBeVisible();

    const claudeButton = sidebar.getByTestId('agent-button-claude-code');
    const kiroButton = sidebar.getByTestId('agent-button-kiro');
    const grokButton = sidebar.getByTestId('agent-button-grok');

    await expect(kiroButton).toBeVisible();
    await expect(claudeButton).toBeVisible();
    await expect(grokButton).toBeVisible();

    // Default is Claude Code (persisted store may vary — force via click)
    await claudeButton.click();
    await expect(sidebar.getByText('Claude Code sessions', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    const newSessionBtn = sidebar.getByTestId('new-agent-session');
    await expect(newSessionBtn).toBeVisible({ timeout: 5000 });
    await expect(newSessionBtn).toContainText('New Claude Code session');

    await kiroButton.click();
    await expect(sidebar.getByText('Kiro sessions', { exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(newSessionBtn).toContainText('New Kiro session');

    await grokButton.click();
    await expect(sidebar.getByText('Grok sessions', { exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  test('active agent button has highlighted style', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByTestId('chat-sidebar');
    const kiroButton = sidebar.getByTestId('agent-button-kiro');
    const claudeButton = sidebar.getByTestId('agent-button-claude-code');

    await claudeButton.click();
    await expect(claudeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(kiroButton).toHaveAttribute('aria-pressed', 'false');

    await kiroButton.click();
    await expect(kiroButton).toHaveAttribute('aria-pressed', 'true');
    await expect(claudeButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('theme toggle switches light and dark', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();

    const html = page.locator('html');
    // defaultTheme is dark
    await expect(html).toHaveClass(/dark/);

    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);

    await toggle.click();
    await expect(html).toHaveClass(/dark/);
  });
});
