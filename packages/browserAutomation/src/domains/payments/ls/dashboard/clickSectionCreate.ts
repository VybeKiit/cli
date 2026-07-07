import type { Page } from 'playwright';

// `resend` or `jts` button text -> ignored as a create action.
const NON_CREATE_BUTTON_TEXT_PATTERN = /resend|jts/i;

/**
 * Click the add/create control nearest to a section heading in the Lemon Squeezy dashboard.
 *
 * @param page - Playwright page to operate on.
 * @param headingText - Exact section heading text.
 * @returns True when a nearby create button was clicked.
 * @example
 * const clicked = await clickSectionCreate(page, 'API keys');
 */
export const clickSectionCreate = async (page: Page, headingText: string): Promise<boolean> => {
  const heading = page.getByRole('heading', { name: headingText, exact: true });
  if ((await heading.count()) > 0) {
    const following = heading.locator(
      'xpath=following::button[not(contains(@id,"menu-button-1"))][1]',
    );
    if ((await following.count()) > 0) {
      await following.click({ timeout: 8000 });
      return true;
    }
    const row = heading.locator('xpath=ancestor::*[self::div or self::section][1]');
    const rowButton = row
      .getByRole('button')
      .filter({ hasNotText: NON_CREATE_BUTTON_TEXT_PATTERN })
      .last();
    if ((await rowButton.count()) > 0) {
      await rowButton.click({ timeout: 8000 });
      return true;
    }
  }

  const panel = page
    .locator(`h1:has-text("${headingText}"), h2:has-text("${headingText}")`)
    .first();
  if ((await panel.count()) > 0) {
    const btn = panel.locator('xpath=following::button[1]');
    if ((await btn.count()) > 0) {
      await btn.click({ timeout: 8000 });
      return true;
    }
  }

  return false;
};
