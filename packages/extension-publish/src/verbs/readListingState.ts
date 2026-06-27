import type { VerbContext } from '../types';

import { connectToCwsChrome } from '../connect';
import { MissingItemIdError } from '../errors';
import {
  readAssetSlots,
  readCertifications,
  readDataUseDisclosure,
  readDistributionRadios,
  readListingComboboxes,
  readOptionalText,
  readPermissionsJustifications,
  readRegions,
  readRemoteCodeJustification,
  readRemoteCodeRadio,
} from '../listingSourceFields';
import { fieldLocator } from '../locator';
import { type CwsListing, CwsListingSchema } from '../schema';
import {
  discoverDeveloperGroupId,
  distributionUrl,
  listingUrl,
  packageUrl,
  privacyUrl,
  statusUrl,
} from '../urls';

/**
 * Read the live store-listing state for an extension and return it as a
 * validated `CwsListing`. Used as the read side of the drift check inside
 * `updateListing`, and as the body of `importListing`.
 *
 * Read-only: the verb opens its own page, navigates to each tab, reads
 * each field through the selector inventory, and disposes the page. No
 * clicks are made. No state is mutated.
 *
 * The returned value is parsed through `CwsListingSchema` so the caller
 * receives either a fully-typed listing or a Zod error — the verb never
 * yields half-validated data.
 */
export async function readListingState(ctx: VerbContext): Promise<CwsListing> {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'readListingState');
  }

  const session = await connectToCwsChrome(ctx);
  try {
    const log = ctx.log ?? console;
    log.log(`[cws] reading listing state for ${ctx.extension.name}`);

    const groupId = await discoverDeveloperGroupId(session.page);

    await session.page.goto(listingUrl(groupId, ctx.extension.chromeWebStoreId));
    const listing = await readListingTab(session.page);

    await session.page.goto(privacyUrl(groupId, ctx.extension.chromeWebStoreId));
    const privacy = await readPrivacyTab(session.page);

    await session.page.goto(distributionUrl(groupId, ctx.extension.chromeWebStoreId));
    const distribution = await readDistributionTab(session.page);

    await session.page.goto(packageUrl(groupId, ctx.extension.chromeWebStoreId));
    const packageState = await readPackageTab(session.page);

    await session.page.goto(statusUrl(groupId, ctx.extension.chromeWebStoreId));
    const status = await readStatusTab(session.page);

    return CwsListingSchema.parse({
      distribution,
      listing,
      package: packageState,
      privacy,
      status,
    });
  } finally {
    await session.dispose();
  }
}

function classifyReviewLabel(label: string): CwsListing['status']['review'] {
  const lower = label.toLowerCase();
  if (lower.includes('draft')) return 'draft';
  if (lower.includes('pending review') || lower.includes('in review')) return 'in_review';
  if (lower.includes('published')) return 'published';
  if (lower.includes('rejected') || lower.includes('removed')) return 'rejected';
  return 'unknown';
}

/**
 * Read the distribution tab. Payments and visibility are radio groups
 * with stable visible labels; regions is a long list of `<li>` rows each
 * containing one anonymous checkbox plus the region name as text.
 */
async function readDistributionTab(
  page: Parameters<typeof fieldLocator>[0],
): Promise<CwsListing['distribution']> {
  // Expand the regions list if collapsed — when most regions are
  // selected the dev console shows a "Show more" affordance to reveal
  // the rest. Best-effort; ignore if already expanded.
  await page
    .getByRole('button', { name: 'Show more' })
    .first()
    .click({ timeout: 1_500 })
    .catch(() => undefined);

  const { payments, visibility } = await readDistributionRadios(page);
  const regions = await readRegions(page);

  return { payments, regions, visibility };
}

/**
 * Pull every visible value from the listing-edit tab. Each field's
 * selector is looked up in the inventory; missing/stale entries throw
 * `SelectorMissingError` rather than returning empty strings.
 */
async function readListingTab(
  page: Parameters<typeof fieldLocator>[0],
): Promise<CwsListing['listing']> {
  const description = await fieldLocator(page, 'listing.description').inputValue();
  const supportUrl = await fieldLocator(page, 'listing.supportUrl').inputValue();
  const homepageUrl = await readOptionalText(page, 'listing.homepageUrl');
  const matureContent = (await fieldLocator(page, 'listing.matureContent').isChecked()) ?? false;
  const globalPromoVideo = await readOptionalText(page, 'listing.globalPromoVideo');

  const { category, language, officialUrl } = await readListingComboboxes(page);

  const assets = await readAssetSlots(page);

  return {
    category: category as CwsListing['listing']['category'],
    description,
    globalPromoVideo,
    homepageUrl,
    icon: assets.icon,
    language,
    matureContent,
    officialUrl,
    promoTileMarquee: assets.promoTileMarquee,
    promoTileSmall: assets.promoTileSmall,
    screenshots: assets.screenshots,
    supportUrl,
  };
}

/**
 * Read the package tab. Today the only persisted setting we capture is
 * the verified-CRX opt-in switch. The "Upload new package" / "Roll back"
 * affordances are action buttons handled by other verbs (rollback is
 * destructive and refused by `safeClick`).
 */
async function readPackageTab(
  page: Parameters<typeof fieldLocator>[0],
): Promise<CwsListing['package']> {
  const optedIn = (await page.evaluate(`(() => {
    const optInButton = Array.from(document.querySelectorAll('button')).find((b) =>
      /Opt in to verified CRX uploads/i.test(b.getAttribute('aria-label') || ''),
    );
    return !optInButton;
  })()`)) as boolean;
  return { verifiedUploadsOptIn: optedIn };
}

/**
 * Pull privacy answers from the privacy tab. The dev console renders this
 * as a fixed checklist; we read each answer through its selector entry.
 */
async function readPrivacyTab(
  page: Parameters<typeof fieldLocator>[0],
): Promise<CwsListing['privacy']> {
  const singlePurpose = await fieldLocator(page, 'privacy.singlePurpose').inputValue();
  const privacyPolicyUrl = await readOptionalText(page, 'privacy.privacyPolicyUrl');
  const permissionsJustification = await readPermissionsJustifications(page);
  const dataUseDisclosure = await readDataUseDisclosure(page);
  const usesRemoteCode = await readRemoteCodeRadio(page);
  const remoteCodeJustification = await readRemoteCodeJustification(page);
  const certifications = await readCertifications(page);

  return {
    certifications,
    dataUseDisclosure,
    permissionsJustification,
    privacyPolicyUrl,
    remoteCodeJustification,
    singlePurpose,
    usesRemoteCode,
  };
}

/**
 * Read the status tab. The dev console renders the live status as a
 * `Status: <state> - <visibility>` line near the top of the page (e.g.
 * "Status: Published - public", "Status: Draft", "Status: In review").
 * We parse that line and classify the leading state into the schema's
 * union; `reviewLabel` carries the verbatim text so logs and UIs can
 * show Google's exact wording even when classification falls through.
 */
async function readStatusTab(
  page: Parameters<typeof fieldLocator>[0],
): Promise<CwsListing['status']> {
  const label = (await page.evaluate(`(() => {
    const text = (document.body.innerText || '');
    const match = text.match(/Status:\\s*([^\\n]+)/);
    return match ? match[1].trim() : '';
  })()`)) as string;
  return { review: classifyReviewLabel(label), reviewLabel: label };
}
