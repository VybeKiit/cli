import { SelectorMissingError } from '../../core/errors';
import {
  type SelectorEntry,
  isSelectorFresh,
  resolveFreshSelectorEntry,
} from '../../core/selectors';
import { RECORDED_SELECTORS } from './selectors.generated';

export type { SelectorEntry };

const DEFAULT_SELECTORS: Record<string, SelectorEntry[]> = {
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

const SELECTORS: Record<string, SelectorEntry[]> = { ...DEFAULT_SELECTORS, ...RECORDED_SELECTORS };

export function resolveSelectorEntry(fieldKey: string, today: Date = new Date()): SelectorEntry {
  return resolveFreshSelectorEntry(SELECTORS[fieldKey], fieldKey, today, (key, reason) => {
    throw new SelectorMissingError(key, reason);
  });
}

export { isSelectorFresh as isFresh };
