import type { Page } from 'playwright';

import { clickSectionCreate } from '../dashboard/clickSectionCreate';
import { waitForDialogInputs } from '../dashboard/waitForDialogInputs';
import { scrapeApiKeyFromHtml } from '../scrape';

const ORIGIN = 'https://app.lemonsqueezy.com';

/** Create an API key in the dashboard — only way to mint keys (no LS API endpoint). */
export async function createApiKeyInDashboard(page: Page, name: string): Promise<string> {
  await page.goto(`${ORIGIN}/settings/api`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const clicked =
    (await clickSectionCreate(page, 'API keys')) ||
    (await page
      .getByRole('button', { name: /create api key/i })
      .click({ timeout: 3_000 })
      .then(() => true)
      .catch(() => false));
  if (!clicked) throw new Error('Could not open API key create dialog');

  await waitForDialogInputs(page);
  await page.getByPlaceholder(/api key name/i).fill(name);
  await page.getByRole('button', { name: /create api key/i }).click({ timeout: 8_000 });
  await page.waitForTimeout(1_500);

  const fromInput = await page
    .locator('input[readonly], input[type="text"]')
    .evaluateAll((inputs) => {
      for (const el of inputs) {
        const value = (el as { value?: string }).value?.trim();
        if (value && value.length >= 20) return value;
      }
      return null;
    });
  if (fromInput) return fromInput;

  const html = await page.content();
  const scraped = scrapeApiKeyFromHtml(html);
  if (!scraped) {
    throw new Error(
      'API key was created but could not be read from the dashboard (copy it manually).',
    );
  }
  return scraped;
}
