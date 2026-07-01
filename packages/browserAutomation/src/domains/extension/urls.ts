import type { Page } from 'playwright';

/**
 * Dev console URL builders. Centralised so the URL pattern is one obvious
 * place to update if Google changes paths (which happens every couple of
 * years).
 *
 * Why every per-item URL is keyed by `groupId` + `itemId`:
 *   The dev console scopes every per-item page under a "developer group"
 *   UUID — `/devconsole/<groupId>/<itemId>/edit/<tab>`. The group ID is
 *   assigned per developer account, fixed for the lifetime of the account,
 *   and not surfaced anywhere in the UI. We discover it once per session by
 *   hitting `/devconsole/?hl=en` and reading the redirect target — see
 *   {@link discoverDeveloperGroupId}.
 *
 * Why every URL carries `?hl=en`: ARIA names — and therefore every selector
 * in `selectors.ts` — are localized. Pinning `hl=en` forces the dev console
 * UI into English regardless of the signed-in account's language preference,
 * so a recorded selector keeps resolving even if the operator switches
 * Google account language. Google honors `hl=en` app-wide.
 *
 * Tab inventory (confirmed by probe, 2026-05-08):
 *   - `/edit/listing`       store-listing copy + visual assets
 *   - `/edit/privacy`       single purpose, permission justifications, data-use disclosures
 *   - `/edit/package`       package upload (zip), publish controls
 *   - `/edit/distribution`  visibility, regions, pricing
 *   - `/edit/status`        review-status badge, violations panel, version history
 */

const ROOT = 'https://chrome.google.com/webstore/devconsole';
const LOCALE = 'hl=en';

/**
 * The dashboard / item list. Used as a navigation anchor, as the starting
 * point for `createNewItem`, and as the discovery surface for the
 * developer-group ID.
 */
export function dashboardUrl(): string {
  return `${ROOT}/?${LOCALE}`;
}

/**
 * Distribution tab — visibility (public / unlisted / private), regions,
 * pricing.
 */
export function distributionUrl(groupId: string, itemId: string): string {
  return editUrl(groupId, itemId, 'distribution');
}

/**
 * Store-listing edit tab — description, support URL, homepage URL,
 * official URL, category, language, mature-content switch, global promo
 * video, plus the "Save draft" / "Submit for review" page actions.
 */
export function listingUrl(groupId: string, itemId: string): string {
  return editUrl(groupId, itemId, 'listing');
}

/**
 * Package tab — zip upload + the publish control. The same operations are
 * available via the official Publish API; this URL is the UI fallback.
 */
export function packageUrl(groupId: string, itemId: string): string {
  return editUrl(groupId, itemId, 'package');
}

/**
 * Privacy practices tab — single purpose, per-permission justifications,
 * data-collection disclosures.
 */
export function privacyUrl(groupId: string, itemId: string): string {
  return editUrl(groupId, itemId, 'privacy');
}

/**
 * Status tab — current review-status badge, violations panel, version
 * history table. Read-only verbs that surface "what's going on with this
 * item right now" go here.
 */
export function statusUrl(groupId: string, itemId: string): string {
  return editUrl(groupId, itemId, 'status');
}

function editUrl(groupId: string, itemId: string, tab: string): string {
  return `${ROOT}/${groupId}/${itemId}/edit/${tab}?${LOCALE}`;
}

/**
 * Group-ID UUIDs are 8-4-4-4-12 lowercase hex.
 */
const GROUP_ID_PATTERN =
  /\/devconsole\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?]|$)/;

/**
 * Resolve the developer-group ID for the currently signed-in dev-console
 * account. The dashboard does a client-side redirect from
 * `/devconsole/?hl=en` to `/devconsole/<groupId>/...`; we navigate, poll
 * the URL until the redirect lands, and extract the UUID.
 *
 * Why callers must do this once per session:
 *   - It's per-account, not per-item, so re-discovering for every URL is
 *     wasted navigation.
 *   - It's fixed for the lifetime of the account, so caching the result
 *     for the duration of a verb call is always safe.
 *
 * Failure mode: if the dashboard URL never redirects to a group-scoped
 * path, the CDP-attached Chrome is most likely not signed into a Chrome
 * Web Store developer account at all. Surface that case as a clear error
 * rather than silently returning an empty string.
 */
export async function discoverDeveloperGroupId(page: Page): Promise<string> {
  await page.goto(dashboardUrl(), { timeout: 30_000, waitUntil: 'load' });

  for (let attempt = 0; attempt < 20; attempt++) {
    const match = page.url().match(GROUP_ID_PATTERN);
    if (match) return match[1] as string;
    await page.waitForTimeout(250);
  }

  throw new Error(
    `Could not extract developer group ID from ${page.url()}. Confirm the CDP-attached Chrome is signed into a Chrome Web Store developer account.`,
  );
}
