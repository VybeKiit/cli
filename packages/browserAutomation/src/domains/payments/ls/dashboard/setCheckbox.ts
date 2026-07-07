import type { LsDraftFieldKey } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import type { Locator, Page } from 'playwright';
import { lsField } from './fieldLocator';

/**
 * Read a checkbox state, treating non-checkbox fallback misses as unchecked.
 *
 * @param locator - Checkbox locator to inspect.
 * @returns True when the locator reports checked.
 * @example
 * const checked = await readCheckboxState(locator);
 */
const readCheckboxState = async (locator: Locator): Promise<boolean> => {
  try {
    return await locator.isChecked();
  } catch {
    return false;
  }
};

/**
 * Set a checkbox field to the desired checked state via registry/fallback locators.
 *
 * @param page - Playwright page to operate on.
 * @param fieldKey - Lemon Squeezy draft field key.
 * @param checked - Desired checked state.
 * @returns Nothing after the checkbox matches the requested state.
 * @example
 * await setCheckboxField(page, 'product.settings.licenseKeysToggle', true);
 */
export const setCheckboxField = async (
  page: Page,
  fieldKey: LsDraftFieldKey,
  checked: boolean,
): Promise<void> => {
  const locator = await lsField(page, fieldKey);
  const isChecked = await readCheckboxState(locator);
  if (isChecked !== checked) {
    await locator.click({ timeout: 8000 });
  }
};
