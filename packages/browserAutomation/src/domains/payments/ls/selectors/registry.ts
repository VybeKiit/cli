import { SelectorMissingError } from '@vybekiit/browser-automation/core/errors';
import {
  type SelectorEntry as CoreSelectorEntry,
  resolveFreshSelectorEntry,
} from '@vybekiit/browser-automation/core/selectors';
import { LS_RECORDED_SELECTORS } from './registry.generated';

const DEFAULT_SELECTORS: Record<string, CoreSelectorEntry[]> = {};

const SELECTORS: Record<string, CoreSelectorEntry[]> = {
  ...DEFAULT_SELECTORS,
  ...LS_RECORDED_SELECTORS,
};

/**
 * Resolve all recorded Lemon Squeezy selector candidates for a field.
 *
 * @param fieldKey - Selector field key from the Lemon Squeezy automation flow.
 * @returns The selector entries recorded for the field.
 * @example
 * const entries = resolveLsSelector('checkout.name');
 */
export const resolveLsSelector = (fieldKey: string): CoreSelectorEntry[] => {
  const entries = SELECTORS[fieldKey];
  if (!entries || entries.length === 0) {
    throw new SelectorMissingError(fieldKey, 'missing');
  }
  return entries;
};

/**
 * Resolve the first fresh Lemon Squeezy selector entry for a field.
 *
 * @param fieldKey - Selector field key from the Lemon Squeezy automation flow.
 * @param today - Date used to evaluate selector freshness.
 * @returns A fresh selector entry for the field.
 * @example
 * const entry = resolveLsSelectorEntry('checkout.name', new Date('2026-01-01'));
 */
export const resolveLsSelectorEntry = (
  fieldKey: string,
  today: Date = new Date(),
): CoreSelectorEntry =>
  resolveFreshSelectorEntry(
    SELECTORS[fieldKey],
    fieldKey,
    (key, reason) => {
      throw new SelectorMissingError(key, reason);
    },
    today,
  );
