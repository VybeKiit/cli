import type { Page } from 'playwright';

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { VerbContext } from '../types';

import { connectToCwsChrome } from '../connect';
import { type ListingFieldDiff, diffListing, formatListingDiff } from '../diff';
import { MissingItemIdError } from '../errors';
import { cwsListingPath } from '../store';
import {
  applyCertifications,
  applyDataUseDisclosure,
  applyPermissionsJustification,
  applyRegions,
  fillTextareaByLabelPrefix,
  isFileUploadField,
  setListingComboboxField,
  setRadioByLabel,
  setRemoteCodeRadio,
  setSwitchByKey,
} from '../listingSourceFields';
import { fieldLocator } from '../locator';
import { safeClick } from '../safeClick';
import { type CwsListing, CwsListingSchema } from '../schema';
import {
  discoverDeveloperGroupId,
  distributionUrl,
  listingUrl,
  packageUrl,
  privacyUrl,
} from '../urls';
import { runVerifyGate } from '../verifyGate';
import { readListingState } from './readListingState';

/**
 * Apply a precomputed `ListingFieldDiff[]` to the dev console, navigating
 * once per tab and dispatching each change to the matching writer. The
 * `saveDrafts` option controls whether `Save draft` is clicked at the end
 * of each touched tab.
 *
 * Exported so the e2e dry-run probe (`scripts/cws/e2e-dry-run.ts`) can
 * exercise every writer surface without committing to a real draft. The
 * production `updateListing` path always passes `saveDrafts: true`.
 *
 * Callers driving a dry-run should attach their own `dialog` handler to
 * accept the dev console's "discard unsaved changes?" prompt before
 * calling this — registering it here would leak listeners across calls.
 */
export async function applyTabChanges(
  page: Page,
  groupId: string,
  itemId: string,
  changes: readonly ListingFieldDiff[],
  options: { saveDrafts: boolean },
): Promise<void> {
  const tabs: Array<{
    apply: (page: Page, change: ListingFieldDiff) => Promise<void>;
    prefix: string;
    url: string;
  }> = [
    { apply: applyListingFieldChange, prefix: 'listing.', url: listingUrl(groupId, itemId) },
    { apply: applyPrivacyFieldChange, prefix: 'privacy.', url: privacyUrl(groupId, itemId) },
    {
      apply: applyDistributionFieldChange,
      prefix: 'distribution.',
      url: distributionUrl(groupId, itemId),
    },
    { apply: applyPackageFieldChange, prefix: 'package.', url: packageUrl(groupId, itemId) },
  ];

  for (const tab of tabs) {
    const tabChanges = changes.filter((change) => change.field.startsWith(tab.prefix));
    if (tabChanges.length === 0) continue;
    await page.goto(tab.url);
    for (const change of tabChanges) {
      await tab.apply(page, change);
    }
    if (options.saveDrafts) {
      await safeClick(fieldLocator(page, 'actions.saveDraftButton'), 'updateListing');
    }
  }
}

/**
 * Push `cws-listing.ts` to the dev console.
 *
 * Sequence (drift-aware):
 *
 *  1. Run the verify gate (`pnpm verify:release` for the extension).
 *     Failing typecheck/test/build/manifest-validation aborts here, before
 *     any browser action.
 *  2. Read the live CWS state (`readListingState`).
 *  3. Load `cws-listing.ts` and validate against the schema.
 *  4. Compute `diffListing(remote, local)` — this is the proposed change.
 *  5. Apply the proposed change field-by-field, navigating once per tab.
 *     Every click goes through `safeClick`.
 *  6. Click "Save draft" on each tab that had writes.
 *
 * The verb does NOT submit for review or publish — those are separate
 * verbs (ADR-0012). A draft sitting on the dev console after this verb
 * succeeds is the expected post-condition.
 */
export async function updateListing(ctx: VerbContext): Promise<{ applied: ListingFieldDiff[] }> {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'updateListing');
  }
  const log = ctx.log ?? console;

  const local = await loadLocalListing(ctx);

  await runVerifyGate(ctx);

  const remote = await readListingState(ctx);
  const proposed = diffListing(remote, local);

  if (proposed.length === 0) {
    log.log(`[cws] no changes to push for ${ctx.extension.name}`);
    return { applied: [] };
  }

  log.log(`[cws] proposed changes:\n${formatListingDiff(proposed)}`);

  const session = await connectToCwsChrome(ctx);
  try {
    const groupId = await discoverDeveloperGroupId(session.page);
    await applyTabChanges(session.page, groupId, ctx.extension.chromeWebStoreId, proposed, {
      saveDrafts: true,
    });
    return { applied: proposed };
  } finally {
    await session.dispose();
  }
}

/**
 * Map one diff entry to a Playwright write against the distribution tab.
 * `payments` and `visibility` are radio groups; `regions` is a long
 * Record<region, boolean> we apply by toggling each `<li>` whose
 * checkbox state disagrees with the desired map.
 */
async function applyDistributionFieldChange(page: Page, change: ListingFieldDiff): Promise<void> {
  switch (change.field) {
    case 'distribution.payments':
      await setRadioByLabel(page, String(change.after));
      return;
    case 'distribution.regions':
      await applyRegions(page, change.before, change.after);
      return;
    case 'distribution.visibility':
      await setRadioByLabel(page, String(change.after));
      return;
  }
  throw new Error(
    `Distribution field "${change.field}" has no writer branch; add one in updateListing.ts.`,
  );
}

/**
 * Map one diff entry to a Playwright write against the listing tab. The
 * field path is already the full selector key (`listing.<sub>`), so the
 * locator lookup is direct.
 *
 * Routing rules:
 *
 *  - `listing.matureContent` → toggle `[role=switch]` if its `aria-checked`
 *    state disagrees with the desired value.
 *  - Combobox fields → open the menu, click the option whose accessible
 *    name equals the desired value.
 *  - Asset fields → fail-closed via `isFileUploadField`.
 *  - Anything else → `fill()` the underlying textbox.
 */
async function applyListingFieldChange(page: Page, change: ListingFieldDiff): Promise<void> {
  if (change.field === 'listing.matureContent') {
    await setSwitchByKey(page, 'listing.matureContent', Boolean(change.after));
    return;
  }

  if (await setListingComboboxField(page, change.field, change.after)) {
    return;
  }

  if (isFileUploadField(change.field)) {
    throw new Error(
      `Field "${change.field}" is an asset slot. Asset uploads are not supported by update-listing — change the image on the dev console and re-run \`pnpm cws import-listing ${change.field}\`.`,
    );
  }

  await fieldLocator(page, change.field).fill(String(change.after ?? ''));
}

/**
 * Map one diff entry to a Playwright write against the package tab.
 *
 * Today only `verifiedUploadsOptIn` is wired. Opting in is a one-way
 * action — the dev console offers no opt-out affordance — so the writer
 * accepts only `false → true` and otherwise no-ops with a warning, which
 * preserves the no-deletion contract.
 */
async function applyPackageFieldChange(page: Page, change: ListingFieldDiff): Promise<void> {
  if (change.field !== 'package.verifiedUploadsOptIn') {
    throw new Error(
      `Package field "${change.field}" has no writer branch; add one in updateListing.ts.`,
    );
  }
  if (change.after !== true) {
    throw new Error(
      `Verified-CRX opt-in cannot be reverted via the dev console; refusing to push ${change.field} = ${String(change.after)}.`,
    );
  }
  const optIn = page.getByRole('button', { name: 'Opt in to verified CRX uploads' }).first();
  await safeClick(optIn, 'updateListing');
}

/**
 * Map one diff entry to a Playwright write against the privacy tab. Handles
 * the structured shapes (`permissionsJustification`,
 * `dataUseDisclosure`) inline rather than dispatching to per-subkey
 * selectors — both shapes are enumerated against the live DOM, mirroring
 * the read side.
 */
async function applyPrivacyFieldChange(page: Page, change: ListingFieldDiff): Promise<void> {
  switch (change.field) {
    case 'privacy.certifications':
      await applyCertifications(page, change.before, change.after);
      return;
    case 'privacy.dataUseDisclosure':
      await applyDataUseDisclosure(page, change.before, change.after);
      return;
    case 'privacy.permissionsJustification':
      await applyPermissionsJustification(page, change.before, change.after);
      return;
    case 'privacy.remoteCodeJustification':
      await fillTextareaByLabelPrefix(page, 'Justification', String(change.after ?? ''));
      return;
    case 'privacy.usesRemoteCode':
      await setRemoteCodeRadio(page, Boolean(change.after));
      return;
  }

  if (typeof change.after === 'string') {
    await fieldLocator(page, change.field).fill(change.after);
    return;
  }

  if (change.after === undefined) {
    await fieldLocator(page, change.field).fill('');
    return;
  }

  throw new Error(
    `Privacy field "${change.field}" has an unexpected value type (${typeof change.after}); add a writer branch in updateListing.ts.`,
  );
}

/**
 * Dynamically import the per-extension `cws-listing.ts` and validate it.
 * Importing keeps the file as a typed module rather than a stringly-typed
 * JSON blob.
 */
async function loadLocalListing(ctx: VerbContext): Promise<CwsListing> {
  const filePath = cwsListingPath(ctx.repoRoot);
  if (!existsSync(filePath)) {
    throw new Error(
      `No cws-listing.ts found at ${filePath}. Run \`vybekiit-automate extension import --json\` first to bootstrap from live CWS state.`,
    );
  }
  const moduleUrl = pathToFileURL(filePath).href;
  const imported: { default?: unknown } = await import(moduleUrl);
  return CwsListingSchema.parse(imported.default);
}
