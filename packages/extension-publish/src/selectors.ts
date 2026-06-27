import { SelectorMissingError } from './errors';
import { RECORDED_SELECTORS } from './selectors.generated';

/**
 * One entry in the selector inventory. Each field the verbs need from the
 * dev console is named, has a list of resolution strategies (tried in
 * order), and is dated with the last time a human verified the strategy
 * actually resolves.
 *
 * Strategies, ordered by preference (ADR-0011 / ADR-0012):
 *
 *  1. ARIA name (preferred) — `getByRole(role, { name })`. Survives CSS
 *     refactors because Google preserves accessible names for a11y reasons.
 *  2. ARIA label — `getByLabel(text)`. Same survival profile.
 *  3. Placeholder — `getByPlaceholder(text)`.
 *  4. CSS — last resort, brittle, must be re-verified often.
 *
 * `verifiedAt` is the ISO date the strategy was last confirmed against the
 * live dev console. Verbs refuse to use any selector older than
 * {@link SELECTOR_STALENESS_DAYS} days — fail-closed semantics.
 */
export type SelectorEntry =
  | { kind: 'css'; selector: string; verifiedAt: null | string }
  | { kind: 'label'; text: RegExp | string; verifiedAt: null | string }
  | { kind: 'placeholder'; text: RegExp | string; verifiedAt: null | string }
  | { kind: 'role'; name: RegExp | string; role: string; verifiedAt: null | string };

/**
 * Refuse selectors older than this many days. Forces periodic re-recording
 * even if the agent appears to be working — the dev console has changed in
 * subtle ways that broke writes silently in past Google UI revamps, and
 * stale selectors hide that.
 */
const SELECTOR_STALENESS_DAYS = 90;

/**
 * Field-by-field selector inventory. Each field key matches a property in
 * `CwsListing` (or a dev-console UI element with no listing-side
 * counterpart, like `submitReviewButton`).
 *
 * **Defaults are empty (`[]`).** The package ships with the schema and the
 * framework, but no field can be read or written until a human runs
 * `pnpm cws open-recorder` + `pnpm cws apply-recorded-selectors`, which
 * writes verified entries into `selectors.generated.ts`. The map below is
 * merged with `RECORDED_SELECTORS` at module load — keys present in the
 * generated file override the empty defaults here. This is the fail-closed
 * posture per ADR-0012.
 *
 * When you hand-fill an entry: prefer ARIA. Use the Playwright Inspector
 * via `pnpm cws open-recorder <ext>` against the live dev console. Pick
 * names that read like the user-visible label, not internal class names.
 */
const DEFAULT_SELECTORS: Record<string, SelectorEntry[]> = {
  'actions.moreOptionsMenu': [],
  'actions.publishButton': [],
  // Page-level action affordances (live across multiple edit tabs).
  'actions.saveDraftButton': [],
  'actions.submitReviewButton': [],
  // Listing tab — `/edit/listing`. Combobox-backed fields (`category`,
  // `language`, `officialUrl`) are intentionally absent: they are read
  // and written through DOM enumeration in `readListingState.ts` /
  // `updateListing.ts` because Playwright's `getByRole('combobox',{name})`
  // matcher resolves the dev console's composed accessible names
  // unreliably. Asset fields (`screenshots`, `icon`, `promoTileSmall`,
  // `promoTileMarquee`) are surfaced as presence labels in the read path
  // and fail-closed in the write path.
  'listing.description': [],

  'listing.globalPromoVideo': [],
  'listing.homepageUrl': [],

  'listing.matureContent': [],
  'listing.supportUrl': [],
  // Dashboard — used by `createNewItem`.
  'newItem.addButton': [],
  'newItem.assignedItemId': [],

  'newItem.zipUploadInput': [],
  'privacy.privacyPolicyUrl': [],
  // Privacy tab — `/edit/privacy`. Per-permission justifications, the
  // data-usage checklist, the Remote-code radio, and the certifications
  // are all DOM-enumerated; they don't need selector inventory entries.
  'privacy.singlePurpose': [],
};

/**
 * Effective inventory — defaults overlaid with whatever the recorder has
 * written into `selectors.generated.ts`. Recorded entries fully replace the
 * default for a key (we don't append, so a stale recording can be cleared
 * by re-recording with one fewer strategy).
 */
const SELECTORS: Record<string, SelectorEntry[]> = { ...DEFAULT_SELECTORS, ...RECORDED_SELECTORS };

/**
 * Resolve a selector entry for a field, asserting that an entry exists and
 * is fresh. Verbs call this once per field, then use the returned entry
 * to build the actual Playwright locator.
 *
 * @throws {SelectorMissingError} if the field has no entries, or every
 *   entry is older than the staleness threshold.
 */
export function resolveSelectorEntry(fieldKey: string, today: Date = new Date()): SelectorEntry {
  const entries = SELECTORS[fieldKey];
  if (!entries || entries.length === 0) {
    throw new SelectorMissingError(fieldKey, 'missing');
  }
  const fresh = entries.find((entry) => isFresh(entry, today));
  if (!fresh) throw new SelectorMissingError(fieldKey, 'stale');
  return fresh;
}

function isFresh(entry: SelectorEntry, today: Date): boolean {
  if (!entry.verifiedAt) return false;
  const verified = new Date(entry.verifiedAt);
  if (Number.isNaN(verified.getTime())) return false;
  const ageMs = today.getTime() - verified.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays <= SELECTOR_STALENESS_DAYS;
}
