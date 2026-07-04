import { clickSectionCreate } from '@vybekiit/browserAutomation/domains/payments/ls/dashboard/clickSectionCreate';
import { waitForDialogInputs } from '@vybekiit/browserAutomation/domains/payments/ls/dashboard/waitForDialogInputs';
import { scrapeApiKeyFromHtml } from '@vybekiit/browserAutomation/domains/payments/ls/scrape';
import type { Page } from 'playwright';

const ORIGIN = 'https://app.lemonsqueezy.com';

/** Create an API key in the dashboard — only way to mint keys (no LS API endpoint). */
async function openApiKeyCreateDialog(page: Page): Promise<boolean> {
  const heading = page.getByRole('heading', { name: 'API keys', exact: true });
  await heading.waitFor({ state: 'visible', timeout: 15_000 });

  if (await clickSectionCreate(page, 'API keys')) return true;

  const plusInSection = heading
    .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]//button')
    .last();
  if ((await plusInSection.count()) > 0) {
    await plusInSection.click({ timeout: 8000 });
    return true;
  }

  return page
    .getByRole('button', { name: /create api key/i })
    .click({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);
}

export async function createApiKeyInDashboard(page: Page, name: string): Promise<string> {
  await page.goto(`${ORIGIN}/settings/api`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const clicked = await openApiKeyCreateDialog(page);
  if (!clicked) throw new Error('Could not open API key create dialog');

  await waitForDialogInputs(page);
  await page.getByPlaceholder(/api key name/i).fill(name);
  await page.getByRole('button', { name: /create api key/i }).click({ timeout: 8000 });

  const dialogTextarea = page.locator('[role="dialog"] textarea');
  await dialogTextarea.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined);
  await page.waitForTimeout(500);

  const fromTextarea = (await dialogTextarea.inputValue().catch(() => '')).trim();
  if (fromTextarea.length >= 20) return fromTextarea;

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
