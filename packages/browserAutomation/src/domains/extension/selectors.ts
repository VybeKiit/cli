import { SelectorMissingError } from '@vybekiit/browser-automation/core/errors';
import {
  type SelectorEntry as CoreSelectorEntry,
  isSelectorFresh,
  resolveFreshSelectorEntry,
} from '@vybekiit/browser-automation/core/selectors';
import { RECORDED_SELECTORS } from './selectors.generated';

export type { SelectorEntry } from '@vybekiit/browser-automation/core/selectors';

const DEFAULT_SELECTORS: Record<string, CoreSelectorEntry[]> = {
  'actions.moreOptionsMenu': [],
  'actions.publishButton': [],
  'actions.saveDraftButton': [],
  'actions.submitReviewButton': [],
  'listing.description': [],
  'listing.globalPromoVideo': [],
  'listing.homepageUrl': [],
  'listing.matureContent': [],
  'listing.supportUrl': [],
  'newItem.addButton': [],
  'newItem.assignedItemId': [],
  'newItem.zipUploadInput': [],
  'privacy.privacyPolicyUrl': [],
  'privacy.singlePurpose': [],
};

const SELECTORS: Record<string, CoreSelectorEntry[]> = {
  ...DEFAULT_SELECTORS,
  ...RECORDED_SELECTORS,
};

/**
 * Resolve the first fresh Chrome Web Store selector entry for a field.
 *
 * @param fieldKey - Selector field key from the extension publishing flow.
 * @param today - Date used to evaluate selector freshness.
 * @returns A fresh selector entry for the field.
 * @example
 * const entry = resolveSelectorEntry('actions.publishButton', new Date('2026-01-01'));
 */
export const resolveSelectorEntry = (
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

/**
 * Check whether a selector entry is fresh for the extension selector inventory.
 *
 * @param entry - Selector entry with verification metadata.
 * @param today - Date used to evaluate selector freshness.
 * @returns True when the selector is within the freshness window.
 * @example
 * const fresh = isFresh(entry, new Date('2026-01-01'));
 */
export const isFresh = isSelectorFresh;
