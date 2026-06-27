import type { CwsListing } from './schema';

/**
 * Structured diff between two `CwsListing` values: one entry per field that
 * differs. The verb layer renders this for human review (or for `terraform
 * plan`-style abort messages on drift).
 *
 * Field paths are dotted (`listing.description`, `privacy.collectsUserData`)
 * — they match the selector inventory keys, so a diff entry's `field` is
 * always a valid argument to `fieldLocator`.
 */
export type ListingFieldDiff = {
  after: unknown;
  before: unknown;
  field: string;
};

/**
 * Compute the diff between two listings. Pure function — no Playwright, no
 * file system, no time. Used in two places:
 *
 *  - `updateListing` calls `diffListing(remoteState, fileState)` and pushes
 *    only the fields where they disagree.
 *  - The drift check calls `diffListing(remoteState, lastImportedSnapshot)`
 *    and aborts if any field has changed remotely since the last import.
 *
 * Why we descend one level for each top-level group: the schema is split
 * by tab (`listing.*`, `privacy.*`), and the verbs operate per-tab. A
 * shallow diff at the top level would emit one giant blob per tab; a
 * fully-recursive diff would split nested shapes like `dataUseDisclosure`
 * into noise. One level deep is the readable middle ground.
 */
export function diffListing(before: CwsListing, after: CwsListing): ListingFieldDiff[] {
  const diffs: ListingFieldDiff[] = [];

  for (const key of LISTING_KEYS) {
    if (!equal(before.listing[key], after.listing[key])) {
      diffs.push({
        after: after.listing[key],
        before: before.listing[key],
        field: `listing.${key}`,
      });
    }
  }

  for (const key of PRIVACY_KEYS) {
    if (!equal(before.privacy[key], after.privacy[key])) {
      diffs.push({
        after: after.privacy[key],
        before: before.privacy[key],
        field: `privacy.${key}`,
      });
    }
  }

  for (const key of DISTRIBUTION_KEYS) {
    if (!equal(before.distribution[key], after.distribution[key])) {
      diffs.push({
        after: after.distribution[key],
        before: before.distribution[key],
        field: `distribution.${key}`,
      });
    }
  }

  for (const key of PACKAGE_KEYS) {
    if (!equal(before.package[key], after.package[key])) {
      diffs.push({
        after: after.package[key],
        before: before.package[key],
        field: `package.${key}`,
      });
    }
  }

  // status.* is read-only — never emitted into a push diff.

  return diffs;
}

/**
 * Render a list of field diffs as a readable plain-text block. Used in
 * `DriftDetectedError.message` and in the `--plan` output.
 */
export function formatListingDiff(diffs: readonly ListingFieldDiff[]): string {
  if (diffs.length === 0) return '(no differences)';
  return diffs
    .map(
      (entry) =>
        `  - ${entry.field}\n      before: ${stringify(entry.before)}\n      after:  ${stringify(entry.after)}`,
    )
    .join('\n');
}

const LISTING_KEYS: readonly (keyof CwsListing['listing'])[] = [
  'description',
  'category',
  'language',
  'supportUrl',
  'homepageUrl',
  'officialUrl',
  'matureContent',
  'globalPromoVideo',
  'screenshots',
  'promoTileSmall',
  'promoTileMarquee',
  'icon',
];

const PRIVACY_KEYS: readonly (keyof CwsListing['privacy'])[] = [
  'singlePurpose',
  'permissionsJustification',
  'privacyPolicyUrl',
  'dataUseDisclosure',
  'usesRemoteCode',
  'remoteCodeJustification',
  'certifications',
];

const DISTRIBUTION_KEYS: readonly (keyof CwsListing['distribution'])[] = [
  'payments',
  'visibility',
  'regions',
];

const PACKAGE_KEYS: readonly (keyof CwsListing['package'])[] = ['verifiedUploadsOptIn'];

/**
 * Structural equality good enough for listing fields. JSON serialisation is
 * fine here — listing values are JSON-shaped by construction (validated by
 * the Zod schema) so round-trip equality is exact.
 */
function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === undefined) return '(unset)';
  return JSON.stringify(value, null, 2).replaceAll('\n', '\n      ');
}
