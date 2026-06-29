/**
 * Recorded selector overrides.
 *
 * Generated 2026-05-08 from `tsx scripts/cws/probe-selectors.ts
 * ehfgkefblcgaaloepfnpdobnkfjbpjje <listing|privacy>` against the live
 * dev console for wavey-audio-transcriber, then merged here.
 *
 * Re-record when:
 *  - Selectors fall outside `SELECTOR_STALENESS_DAYS` (90 days) — verbs
 *    refuse to use them and `resolveSelectorEntry` throws.
 *  - Google ships a dev-console redesign and any verb starts failing with
 *    `SelectorMissingError` or a Playwright timeout on a known field.
 *
 * Strategy notes:
 *  - Inputs and textareas use `getByRole('textbox', { name })`. The dev
 *    console's `<label>` markup wraps both the control and a value-mirror
 *    span, so `getByLabel('…')` can resolve to the wrapper instead of the
 *    control and `.inputValue()` then times out. Targeting the role
 *    sidesteps that.
 *  - Combobox accessible names concatenate the field label with the
 *    current value (e.g. "Category Tools"). Anchored regex on the label
 *    prefix stays stable across value changes.
 *  - Page-level action buttons are stable across tabs and use exact ARIA
 *    names.
 */

import type { SelectorEntry } from './selectors';

const VERIFIED_AT = '2026-05-08';

export const RECORDED_SELECTORS: Record<string, SelectorEntry[]> = {
  'actions.moreOptionsMenu': [
    { kind: 'role', name: 'View more menu options', role: 'button', verifiedAt: VERIFIED_AT },
  ],
  // Page-level action affordances (present across multiple edit tabs).
  'actions.saveDraftButton': [
    { kind: 'role', name: 'Save draft', role: 'button', verifiedAt: VERIFIED_AT },
  ],
  'actions.submitReviewButton': [
    { kind: 'role', name: 'Submit for review', role: 'button', verifiedAt: VERIFIED_AT },
  ],
  // Listing tab — `/edit/listing`
  'listing.description': [
    { kind: 'role', name: 'Description', role: 'textbox', verifiedAt: VERIFIED_AT },
  ],
  'listing.globalPromoVideo': [
    { kind: 'role', name: 'Global promo video', role: 'textbox', verifiedAt: VERIFIED_AT },
  ],

  'listing.homepageUrl': [
    { kind: 'role', name: 'Homepage URL', role: 'textbox', verifiedAt: VERIFIED_AT },
  ],
  'listing.matureContent': [
    { kind: 'role', name: 'Mature content', role: 'switch', verifiedAt: VERIFIED_AT },
  ],

  'listing.supportUrl': [
    { kind: 'role', name: 'Support URL', role: 'textbox', verifiedAt: VERIFIED_AT },
  ],
  'privacy.privacyPolicyUrl': [
    { kind: 'role', name: /^Privacy policy URL/, role: 'textbox', verifiedAt: VERIFIED_AT },
  ],
  // Privacy tab — `/edit/privacy`
  'privacy.singlePurpose': [
    { kind: 'role', name: 'Single purpose description', role: 'textbox', verifiedAt: VERIFIED_AT },
  ],
};
