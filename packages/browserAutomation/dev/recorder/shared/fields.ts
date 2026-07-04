export {
  LS_DRAFT_FIELDS,
  type LsDraftFieldKey,
} from '@vybekiit/browserAutomation/domains/payments/ls/selectors/fields';

/** CWS maintainer draft fields (unchanged). */
export const CWS_DRAFT_FIELDS = [
  'listing.description',
  'listing.supportUrl',
  'listing.homepageUrl',
  'listing.matureContent',
  'listing.globalPromoVideo',
  'privacy.singlePurpose',
  'privacy.privacyPolicyUrl',
  'actions.saveDraftButton',
  'actions.submitReviewButton',
  'actions.publishButton',
  'actions.moreOptionsMenu',
  'newItem.addButton',
  'newItem.zipUploadInput',
  'newItem.assignedItemId',
] as const;
