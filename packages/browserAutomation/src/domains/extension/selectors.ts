import { SelectorMissingError } from '@vybekiit/browser-automation/core/errors';
import {
  type SelectorEntry as CoreSelectorEntry,
  resolveFreshSelectorEntry,
} from '@vybekiit/browser-automation/core/selectors';
import { RECORDED_SELECTORS } from './selectors.generated';

/** Domain alias for the shared selector entry shape (generated inventories import here). */
export type SelectorEntry = CoreSelectorEntry;

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
