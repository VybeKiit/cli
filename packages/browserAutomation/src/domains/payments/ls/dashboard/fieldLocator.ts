// biome-ignore-all lint/suspicious/noUnnecessaryConditions: SelectorEntry is shared across generated inventories, even when the current LS snapshot is CSS-only.

import { SelectorMissingError } from '@vybekiit/browser-automation/core/errors';
import type { SelectorEntry } from '@vybekiit/browser-automation/core/selectors';
import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import type { LsDraftFieldKey } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import { resolveLsSelectorEntry } from '@vybekiit/browser-automation/domains/payments/ls/selectors/registry';
import type { Locator, Page } from 'playwright';
import { LS_FIELD_FALLBACKS, locatorFromFallback } from './fieldFallbacks';

// `[type="file"]` -> match.
const FILE_INPUT_SELECTOR_PATTERN = /\[type=["']file["']\]|\[type=file\]/i;

/**
 * Build a Playwright locator from a registry selector entry.
 *
 * @param page - Playwright page to inspect.
 * @param entry - Selector registry entry.
 * @returns Locator for the registry entry.
 * @example
 * const locator = locatorFromEntry(page, entry);
 */
export const locatorFromEntry = (page: Page, entry: SelectorEntry): Locator => {
  switch (entry.kind) {
    case 'css':
      return page.locator(entry.selector);
    case 'label':
      return page.getByLabel(entry.text);
    case 'placeholder':
      return page.getByPlaceholder(entry.text);
    case 'role':
      return page.getByRole(entry.role as Parameters<Page['getByRole']>[0], { name: entry.name });
    default:
      throw new SelectorMissingError('unknown', 'missing');
  }
};

/**
 * Check whether a locator points to the expected kind of usable element.
 *
 * @param locator - Locator to inspect.
 * @param entry - Registry entry that produced the locator.
 * @returns True when the locator is present and usable for automation.
 * @example
 * const usable = await isUsable(locator, entry);
 */
const isUsable = async (locator: Locator, entry?: SelectorEntry): Promise<boolean> => {
  const count = await locator.count();
  if (count === 0) {
    return false;
  }

  const first = locator.first();
  if (
    entry !== undefined &&
    entry.kind === 'css' &&
    FILE_INPUT_SELECTOR_PATTERN.test(entry.selector)
  ) {
    return first.evaluate((el) => (el as { type?: string }).type === 'file').catch(() => false);
  }

  if (entry !== undefined && entry.kind === 'role' && entry.role === 'checkbox') {
    return first
      .evaluate(
        (el) =>
          el.getAttribute('role') === 'checkbox' || (el as { type?: string }).type === 'checkbox',
      )
      .catch(() => false);
  }

  if (entry !== undefined && entry.kind === 'css' && entry.selector.startsWith('[dusk=')) {
    return first.evaluate((el) => el.isConnected).catch(() => false);
  }

  return first.isVisible().catch(() => false);
};

/**
 * Resolve a text/role/css fallback locator for a Lemon Squeezy field.
 *
 * @param page - Playwright page to inspect.
 * @param fieldKey - Lemon Squeezy draft field key.
 * @returns Usable fallback locator, or null when none applies.
 * @example
 * const locator = await fallbackLocator(page, 'product.nameInput');
 */
const fallbackLocator = async (page: Page, fieldKey: LsDraftFieldKey): Promise<Locator | null> => {
  const fallback = LS_FIELD_FALLBACKS[fieldKey];
  if (fallback === undefined) {
    return null;
  }

  const locator = locatorFromFallback(page, fallback);
  if ((await locator.count()) === 0) {
    return null;
  }

  if (fallback.fileInputIndex !== undefined) {
    const ok = await locator
      .evaluate((el) => (el as { type?: string }).type === 'file')
      .catch(() => false);
    if (ok) {
      return locator;
    }
    return null;
  }

  if (fallback.role !== undefined && fallback.role.role === 'checkbox') {
    const ok = await locator
      .evaluate((el) => el.getAttribute('role') === 'checkbox')
      .catch(() => false);
    if (ok) {
      return locator;
    }
    return null;
  }

  if (fallback.css?.startsWith('[dusk=')) {
    const ok = await locator.evaluate((el) => el.isConnected).catch(() => false);
    if (ok) {
      return locator;
    }
    return null;
  }

  if (
    await locator
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return locator;
  }
  return null;
};

export type LsFieldOptions = {
  readonly log?: Pick<VerbLogger, 'log'>;
};

/**
 * Resolve a Playwright locator for an LS field: registry first, then text/role fallback.
 *
 * @param page - Playwright page to inspect.
 * @param fieldKey - Lemon Squeezy draft field key.
 * @param options - Optional logger for fallback usage.
 * @returns First usable locator for the requested field.
 * @example
 * const nameInput = await lsField(page, 'product.nameInput');
 */
export const lsField = async (
  page: Page,
  fieldKey: LsDraftFieldKey,
  options: LsFieldOptions = {},
): Promise<Locator> => {
  const { log } = options;

  try {
    const entry = resolveLsSelectorEntry(fieldKey);
    const locator = locatorFromEntry(page, entry);
    if (await isUsable(locator, entry)) {
      return locator.first();
    }
  } catch (err) {
    if (!(err instanceof SelectorMissingError)) {
      throw err;
    }
  }

  const fallback = await fallbackLocator(page, fieldKey);
  if (fallback !== null) {
    if (log !== undefined) {
      log.log(`[ls] field "${fieldKey}" using text/role fallback`);
    }
    return fallback.first();
  }

  throw new SelectorMissingError(fieldKey, 'missing');
};

/**
 * Resolve a registry-only locator for static tests and fresh selectors.
 *
 * @param page - Playwright page to inspect.
 * @param fieldKey - Lemon Squeezy draft field key.
 * @returns First locator from the selector registry.
 * @example
 * const locator = lsFieldLocator(page, 'product.nameInput');
 */
export const lsFieldLocator = (page: Page, fieldKey: LsDraftFieldKey): Locator => {
  const entry = resolveLsSelectorEntry(fieldKey);
  return locatorFromEntry(page, entry).first();
};
