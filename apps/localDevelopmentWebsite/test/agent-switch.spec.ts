import { expect, test } from '@playwright/test';

test.describe('agent switch', () => {
  test('switching agent reloads the sidebar sessions', async ({ page }) => {
    await page.goto('/');

    // Wait for the sidebar to show that Kiro sessions loaded (initial agent)
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // The active agent buttons should be visible
    const claudeButton = sidebar.locator('button:has-text("Claude")');
    const kiroButton = sidebar.locator('button:has-text("Kiro")');

    await expect(kiroButton).toBeVisible();
    await expect(claudeButton).toBeVisible();

    // Wait for Kiro sessions label to be present
    const sessionsGroup = sidebar.locator('text=Sessions');
    await expect(sessionsGroup.first()).toBeVisible();

    // Click Claude agent
    await claudeButton.click();

    // Sidebar should show loading briefly, then Claude sessions heading
    // We verify by checking the "New Claude session" button label
    const newSessionBtn = sidebar.locator('button:has-text("New Claude session")');
    await expect(newSessionBtn).toBeVisible({ timeout: 5_000 });

    // Switch back to Kiro
    await kiroButton.click();
    const newKiroBtn = sidebar.locator('button:has-text("New Kiro session")');
    await expect(newKiroBtn).toBeVisible({ timeout: 5_000 });
  });

  test('active agent button has highlighted style', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('aside').first();
    const kiroButton = sidebar.locator('button:has-text("Kiro")');
    const claudeButton = sidebar.locator('button:has-text("Claude")');

    // Kiro should be active by default (bg-zinc-800 means bg="#27272a" or similar)
    await expect(kiroButton).toHaveCSS('background-color', /rgba?(39, 39, 42|rgb\(39, 39, 42\))/i);

    // Claude should be inactive initially
    await expect(claudeButton).not.toHaveCSS('background-color', /rgba?(39, 39, 42|rgb\(39, 39, 42\))/i);

    await claudeButton.click();

    // Claude should now be active
    await expect(claudeButton).toHaveCSS('background-color', /rgba?(39, 39, 42|rgb\(39, 39, 42\))/i);
  });
});
