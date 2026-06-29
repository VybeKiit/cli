import type { Page } from 'playwright';

/** Click add/create control near a section heading in the LS dashboard. */
export async function clickSectionCreate(page: Page, headingText: string): Promise<boolean> {
  const heading = page.getByRole('heading', { name: headingText, exact: true });
  if ((await heading.count()) > 0) {
    const following = heading.locator(
      'xpath=following::button[not(contains(@id,"menu-button-1"))][1]',
    );
    if ((await following.count()) > 0) {
      await following.click({ timeout: 8_000 });
      return true;
    }
    const row = heading.locator('xpath=ancestor::*[self::div or self::section][1]');
    const rowButton = row
      .getByRole('button')
      .filter({ hasNotText: /resend|jts/i })
      .last();
    if ((await rowButton.count()) > 0) {
      await rowButton.click({ timeout: 8_000 });
      return true;
    }
  }

  const panel = page
    .locator(`h1:has-text("${headingText}"), h2:has-text("${headingText}")`)
    .first();
  if ((await panel.count()) > 0) {
    const btn = panel.locator('xpath=following::button[1]');
    if ((await btn.count()) > 0) {
      await btn.click({ timeout: 8_000 });
      return true;
    }
  }

  return false;
}
