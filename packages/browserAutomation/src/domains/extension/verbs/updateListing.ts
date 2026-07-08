// biome-ignore-all lint/suspicious/noUnnecessaryConditions: ListingFieldDiff.field is a runtime selector path split by tab prefix.

import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToCwsChrome } from '@vybekiit/browser-automation/domains/extension/connect';
import {
  diffListing,
  formatListingDiff,
  type ListingFieldDiff,
} from '@vybekiit/browser-automation/domains/extension/diff';
import { MissingItemIdError } from '@vybekiit/browser-automation/domains/extension/errors';
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
} from '@vybekiit/browser-automation/domains/extension/listingSourceWriters';
import { fieldLocator } from '@vybekiit/browser-automation/domains/extension/locator';
import { safeClick } from '@vybekiit/browser-automation/domains/extension/safeClick';
import {
  type CwsListing,
  CwsListingSchema,
} from '@vybekiit/browser-automation/domains/extension/schema';
import { cwsListingPath } from '@vybekiit/browser-automation/domains/extension/store';
import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  distributionUrl,
  listingUrl,
  packageUrl,
  privacyUrl,
} from '@vybekiit/browser-automation/domains/extension/urls';
import { runVerifyGate } from '@vybekiit/browser-automation/domains/extension/verifyGate';
import { Schema } from 'effect';
import type { Page } from 'playwright';
import { readListingState } from './readListingState';

/**
 * Inputs for applying a precomputed CWS listing diff.
 */
type ApplyTabChangesParams = {
  readonly changes: readonly ListingFieldDiff[];
  readonly groupId: string;
  readonly itemId: string;
  readonly page: Page;
  readonly saveDrafts: boolean;
};

/**
 * Tab routing definition used by the CWS listing writer.
 */
type TabChangeWriter = {
  readonly apply: (page: Page, change: ListingFieldDiff) => Promise<void>;
  readonly prefix: string;
  readonly url: string;
};

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
 *
 * @param params - Page, target extension ids, diff entries, and save behavior.
 * @returns A promise that resolves once all requested tab changes have been applied.
 * @example
 * await applyTabChanges({ page, groupId, itemId, changes, saveDrafts: false });
 */
export const applyTabChanges = async ({
  changes,
  groupId,
  itemId,
  page,
  saveDrafts,
}: ApplyTabChangesParams): Promise<void> => {
  const tabs: TabChangeWriter[] = [
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
    if (tabChanges.length > 0) {
      // biome-ignore lint/performance/noAwaitInLoops: CWS tabs must be applied sequentially.
      await page.goto(tab.url);
      for (const change of tabChanges) {
        // biome-ignore lint/performance/noAwaitInLoops: CWS fields must be applied sequentially.
        await tab.apply(page, change);
      }
      if (saveDrafts) {
        await safeClick(fieldLocator(page, 'actions.saveDraftButton'), 'updateListing');
      }
    }
  }
};

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
 *
 * @param ctx - Extension automation context with repo paths, auth state, and logging.
 * @returns The list of field diffs applied to the Chrome Web Store draft.
 * @example
 * const { applied } = await updateListing(ctx);
 */
export const updateListing = async (ctx: VerbContext): Promise<{ applied: ListingFieldDiff[] }> => {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'updateListing');
  }
  const log = resolveVerbLogger(ctx);

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
    await applyTabChanges({
      changes: proposed,
      groupId,
      itemId: ctx.extension.chromeWebStoreId,
      page: session.page,
      saveDrafts: true,
    });
    return { applied: proposed };
  } finally {
    await session.dispose();
  }
};

/**
 * Map one diff entry to a Playwright write against the distribution tab.
 * `payments` and `visibility` are radio groups; `regions` is a long
 * Record<region, boolean> we apply by toggling each `<li>` whose
 * checkbox state disagrees with the desired map.
 *
 * @param page - Chrome Web Store distribution page.
 * @param change - Field diff routed to the distribution tab.
 * @returns A promise that resolves after the field writer completes.
 * @example
 * await applyDistributionFieldChange(page, change);
 */
const applyDistributionFieldChange = async (
  page: Page,
  change: ListingFieldDiff,
): Promise<void> => {
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
    default:
      throw new Error(
        `Distribution field "${change.field}" has no writer branch; add one in updateListing.ts.`,
      );
  }
};

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
 *
 * @param page - Chrome Web Store listing page.
 * @param change - Field diff routed to the listing tab.
 * @returns A promise that resolves after the field writer completes.
 * @example
 * await applyListingFieldChange(page, change);
 */
const applyListingFieldChange = async (page: Page, change: ListingFieldDiff): Promise<void> => {
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

  const fieldValue = change.after === undefined ? '' : String(change.after);
  await fieldLocator(page, change.field).fill(fieldValue);
};

/**
 * Map one diff entry to a Playwright write against the package tab.
 *
 * Today only `verifiedUploadsOptIn` is wired. Opting in is a one-way
 * action — the dev console offers no opt-out affordance — so the writer
 * accepts only `false → true` and otherwise no-ops with a warning, which
 * preserves the no-deletion contract.
 *
 * @param page - Chrome Web Store package page.
 * @param change - Field diff routed to the package tab.
 * @returns A promise that resolves after the field writer completes.
 * @example
 * await applyPackageFieldChange(page, change);
 */
const applyPackageFieldChange = async (page: Page, change: ListingFieldDiff): Promise<void> => {
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
};

/**
 * Map one diff entry to a Playwright write against the privacy tab. Handles
 * the structured shapes (`permissionsJustification`,
 * `dataUseDisclosure`) inline rather than dispatching to per-subkey
 * selectors — both shapes are enumerated against the live DOM, mirroring
 * the read side.
 *
 * @param page - Chrome Web Store privacy page.
 * @param change - Field diff routed to the privacy tab.
 * @returns A promise that resolves after the field writer completes.
 * @example
 * await applyPrivacyFieldChange(page, change);
 */
const applyPrivacyFieldChange = async (page: Page, change: ListingFieldDiff): Promise<void> => {
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
    case 'privacy.remoteCodeJustification': {
      const justification = change.after === undefined ? '' : String(change.after);
      await fillTextareaByLabelPrefix(page, 'Justification', justification);
      return;
    }
    case 'privacy.usesRemoteCode':
      await setRemoteCodeRadio(page, Boolean(change.after));
      return;
    default:
      break;
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
};

/**
 * Dynamically import the per-extension `cws-listing.ts` and validate it.
 * Importing keeps the file as a typed module rather than a stringly-typed
 * JSON blob.
 *
 * @param ctx - Extension automation context containing the repo root.
 * @returns The validated local listing module export.
 * @example
 * const listing = await loadLocalListing(ctx);
 */
const loadLocalListing = async (ctx: VerbContext): Promise<CwsListing> => {
  const filePath = cwsListingPath(ctx.repoRoot);
  if (!existsSync(filePath)) {
    throw new Error(
      `No cws-listing.ts found at ${filePath}. Run \`vybekiit-automate extension import --json\` first to bootstrap from live CWS state.`,
    );
  }
  const moduleUrl = pathToFileURL(filePath).href;
  const imported: { listing?: unknown } = await import(moduleUrl);
  if (imported.listing === undefined) {
    throw new Error(
      `Invalid cws-listing.ts at ${filePath}. Export a named \`listing\` constant or re-run \`vybekiit-automate extension import --json\`.`,
    );
  }
  return Schema.decodeUnknownSync(CwsListingSchema)(imported.listing);
};
