import type { LsDraftFieldKey } from '@vybekiit/browserAutomation/domains/payments/ls/selectors/fields';
import type { Page } from 'playwright';
import { lsField } from './fieldLocator';

/** Set a checkbox field to the desired checked state via registry/fallback locators. */
export async function setCheckboxField(
  page: Page,
  fieldKey: LsDraftFieldKey,
  checked: boolean,
): Promise<void> {
  const locator = await lsField(page, fieldKey);
  const isChecked = await locator.isChecked().catch(() => false);
  if (isChecked !== checked) {
    await locator.click({ timeout: 8000 });
  }
}
