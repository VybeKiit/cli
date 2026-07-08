import { clickSectionCreate } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/clickSectionCreate';
import { waitForDialogInputs } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/waitForDialogInputs';
import { scrapeApiKeyFromHtml } from '@vybekiit/browser-automation/domains/payments/ls/scrape';
import type { Page } from 'playwright';

const ORIGIN = 'https://app.lemonsqueezy.com';
// `Create API key` button -> match.
const CREATE_API_KEY_BUTTON_PATTERN = /create api key/i;
// `API key name` placeholder -> match.
const API_KEY_NAME_PLACEHOLDER_PATTERN = /api key name/i;

/**
 * Ignore a missing textarea because Lemon Squeezy may expose the key in an input.
 *
 * @returns Undefined so API key extraction can try the next source.
 * @example
 * await dialogTextarea.waitFor().catch(ignoreMissingDialogTextarea);
 */
const ignoreMissingDialogTextarea = (): undefined => undefined;

/**
 * Read a textarea value if the API key dialog exposes one.
 *
 * @param page - Playwright page to inspect.
 * @returns Trimmed API key text, or null when the textarea is absent/empty.
 * @example
 * const value = await readDialogTextareaValue(page);
 */
const readDialogTextareaValue = async (page: Page): Promise<string | null> => {
  // biome-ignore lint/security/noSecrets: CSS selector, not a secret.
  const dialogTextarea = page.locator('[role="dialog"] textarea');
  await dialogTextarea
    .waitFor({ state: 'visible', timeout: 8000 })
    .catch(ignoreMissingDialogTextarea);
  await page.waitForTimeout(500);

  try {
    const value = (await dialogTextarea.inputValue()).trim();
    if (value.length >= 20) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Read a readonly input value if the API key dialog exposes one.
 *
 * @param page - Playwright page to inspect.
 * @returns Trimmed API key text, or null when no candidate input exists.
 * @example
 * const value = await readReadonlyInputValue(page);
 */
const readReadonlyInputValue = (page: Page): Promise<string | null> => {
  // biome-ignore lint/security/noSecrets: CSS selector, not a secret.
  return page.locator('input[readonly], input[type="text"]').evaluateAll((inputs) => {
    for (const element of inputs) {
      const { value } = element as { value?: string };
      if (value !== undefined) {
        const trimmed = value.trim();
        if (trimmed.length >= 20) {
          return trimmed;
        }
      }
    }
    return null;
  });
};

/**
 * Open the Lemon Squeezy API-key creation dialog.
 *
 * @param page - Playwright page to operate on.
 * @returns True when a create dialog was opened.
 * @example
 * const opened = await openApiKeyCreateDialog(page);
 */
const openApiKeyCreateDialog = async (page: Page): Promise<boolean> => {
  const heading = page.getByRole('heading', { name: 'API keys', exact: true });
  await heading.waitFor({ state: 'visible', timeout: 15_000 });

  if (await clickSectionCreate(page, 'API keys')) {
    return true;
  }

  const plusInSection = heading
    .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]//button')
    .last();
  if ((await plusInSection.count()) > 0) {
    await plusInSection.click({ timeout: 8000 });
    return true;
  }

  return page
    .getByRole('button', { name: CREATE_API_KEY_BUTTON_PATTERN })
    .click({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);
};

/**
 * Create an API key in the Lemon Squeezy dashboard.
 *
 * @param page - Playwright page to operate on.
 * @param name - API key display name.
 * @returns Created API key value.
 * @example
 * const apiKey = await createApiKeyInDashboard(page, 'VybeKiit API');
 */
export const createApiKeyInDashboard = async (page: Page, name: string): Promise<string> => {
  await page.goto(`${ORIGIN}/settings/api`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const clicked = await openApiKeyCreateDialog(page);
  if (!clicked) {
    throw new Error('Could not open API key create dialog');
  }

  await waitForDialogInputs(page);
  await page.getByPlaceholder(API_KEY_NAME_PLACEHOLDER_PATTERN).fill(name);
  await page.getByRole('button', { name: CREATE_API_KEY_BUTTON_PATTERN }).click({ timeout: 8000 });

  const fromTextarea = await readDialogTextareaValue(page);
  if (fromTextarea !== null) {
    return fromTextarea;
  }

  const fromInput = await readReadonlyInputValue(page);
  if (fromInput !== null) {
    return fromInput;
  }

  const html = await page.content();
  const scraped = scrapeApiKeyFromHtml(html);
  if (scraped === null) {
    throw new Error(
      'API key was created but could not be read from the dashboard (copy it manually).',
    );
  }
  return scraped;
};
